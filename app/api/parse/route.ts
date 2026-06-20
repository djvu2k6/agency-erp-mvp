import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `
You are an expert document parser for an immigration agency.
You will receive a bio-data document — it may be a typed PDF, a scanned image, a form, or a free-form document. Layouts vary widely. Some may have typos, inconsistent formatting, or missing fields.

Your job: extract every possible field you can find. Be flexible — field labels may differ (e.g. "D.O.B", "Birth Date", "Date of Birth" are all the same). Infer intelligently.

Return ONLY a raw JSON object — no markdown, no backticks, no explanation. If a field is not found, return null for that field.

{
  "fullName": "Full legal name of the candidate",
  "email": "Email address or null",
  "phone": "Phone number including country code if present, or null",
  "skills": ["skill1", "skill2"],
  "experienceYears": 0,
  "summary": "1-2 sentence summary of the candidate's profile based on what you read",
  "dob": "Date of birth in YYYY-MM-DD format. If only partial (e.g. year only), return what you have as a string",
  "nationality": "Nationality or country of citizenship (e.g. Indian, Nepali). Look for 'Nationality', 'Citizenship', 'Country' labels",
  "passportNumber": "Passport number — usually alphanumeric like A1234567 or Z9876543. Look carefully even in tables or handwritten sections",
  "passportExpiry": "Passport expiry date in YYYY-MM-DD format or null",
  "gender": "Male / Female / Other or null"
}

Critical rules:
- Never hallucinate data. If genuinely not found, return null.
- Dates must be YYYY-MM-DD. If month/day unclear, best-guess from context.
- Passport numbers are usually 8-9 alphanumeric characters.
- Skills can be inferred from job roles or certifications mentioned if no explicit skills list exists.
`;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: 'No valid file received. Please upload a PDF or image.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    // Determine mime type — default to pdf if browser sends blank
    const mimeType = file.type && file.type !== 'application/octet-stream'
      ? file.type
      : 'application/pdf';

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1, // Low temp = more precise, less creative
      }
    });

    const result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
    ]);

    let rawText = result.response.text();

    // Strip markdown fences if Gemini still wraps despite responseMimeType
    rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

    // Validate it's actual JSON before sending
    let parsedData;
    try {
      parsedData = JSON.parse(rawText);
    } catch (parseError) {
      console.error('JSON parse failed. Raw Gemini output:', rawText);
      return NextResponse.json(
        { error: 'Gemini returned invalid JSON. Try again or use manual entry.', details: rawText.slice(0, 300) },
        { status: 500 }
      );
    }

    return NextResponse.json(parsedData, { status: 200 });

  } catch (error: any) {
    console.error('Gemini Parsing Error:', error.message);

    // Specific Gemini API errors
    if (error.message?.includes('API_KEY')) {
      return NextResponse.json(
        { error: 'Invalid or missing Gemini API key. Check your .env file.' },
        { status: 401 }
      );
    }

    if (error.message?.includes('quota') || error.message?.includes('429')) {
      return NextResponse.json(
        { error: 'Gemini rate limit hit. Wait a minute and try again.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process document.', details: error.message },
      { status: 500 }
    );
  }
}