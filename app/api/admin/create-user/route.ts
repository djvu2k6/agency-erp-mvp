import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { email, password, role } = await req.json();

        // Create the admin client using the Service Role Key (bypasses RLS)
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Create the user in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm their email
        });

        if (authError) throw authError;

        // 2. Insert their role into the public.profiles table
        const { error: profileError } = await supabaseAdmin.from('profiles').insert({
            id: authData.user.id,
            email: email,
            role: role
        });

        if (profileError) throw profileError;

        return NextResponse.json({ success: true, message: "User created successfully!" });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}