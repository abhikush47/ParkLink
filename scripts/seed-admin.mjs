import fs from "fs";
import path from "path";

// Read .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
let supabaseUrl = "";
let serviceRoleKey = "";

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) {
      supabaseUrl = trimmed.split("=")[1].trim();
    }
    if (trimmed.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) {
      serviceRoleKey = trimmed.split("=")[1].trim();
    }
  }
}

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const email = "abhi.kush047@gmail.com";
const password = "786251";
const fullName = "Abhi Kush";

async function main() {
  console.log("Connecting directly to Supabase REST API...");
  console.log("URL:", supabaseUrl);

  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
  };

  // 1. Check existing users
  const listRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "GET",
    headers,
  });

  if (!listRes.ok) {
    const errText = await listRes.text();
    console.error("Failed to list users:", listRes.status, errText);
    process.exit(1);
  }

  const listData = await listRes.json();
  const existingUser = listData.users?.find((u) => u.email === email);

  let userId = null;

  if (existingUser) {
    console.log(`User ${email} already exists (ID: ${existingUser.id}). Updating password and metadata...`);
    userId = existingUser.id;
    const updateRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: "admin",
        },
      }),
    });

    if (!updateRes.ok) {
      console.error("Failed to update user:", await updateRes.text());
      process.exit(1);
    }
    console.log("Password and auth metadata updated successfully.");
  } else {
    console.log(`Creating user ${email}...`);
    const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: "admin",
        },
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error("Failed to create user:", createRes.status, errText);
      process.exit(1);
    }

    const createdData = await createRes.json();
    userId = createdData.id;
    console.log(`User created successfully with ID: ${userId}`);
  }

  // 2. Ensure record in public.profiles table
  console.log("Upserting profile in public.profiles table...");
  const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
    method: "POST",
    headers: {
      ...headers,
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      id: userId,
      full_name: fullName,
      role: "admin",
      phone_number: "+91 9876543210",
      updated_at: new Date().toISOString(),
    }),
  });

  if (!profileRes.ok) {
    const pErr = await profileRes.text();
    console.warn("Notice updating public.profiles:", profileRes.status, pErr);
    console.log("\nNote: If table 'profiles' does not exist yet in Supabase, make sure to execute the SQL migration in your Supabase SQL Editor!");
  } else {
    console.log("Profile successfully upserted into public.profiles with role = 'admin'.");
  }

  console.log("\n=================================================");
  console.log("🎉 SUCCESS: Super Admin Account Configured!");
  console.log("Email:       abhi.kush047@gmail.com");
  console.log("Password:    786251");
  console.log("Role:        admin");
  console.log("Admin Login: http://localhost:3000/admin/login");
  console.log("App Login:   http://localhost:3000/login");
  console.log("=================================================\n");
}

main().catch(console.error);
