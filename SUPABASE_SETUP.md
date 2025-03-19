# Supabase Setup Guide for EFTGuessr

This guide will help you set up your Supabase project for the EFTGuessr game.

## 1. Create a Supabase Account

1. Visit [https://supabase.com/](https://supabase.com/) and click "Start your project"
2. Sign up with GitHub or email
3. Create a new organization if prompted

## 2. Create a New Project

1. From the Supabase dashboard, click "New Project"
2. Choose your organization
3. Name your project (e.g., "tarkov-guessr")
4. Set a secure database password (save this somewhere safe)
5. Choose a region closest to your expected players
6. Click "Create new project"

## 3. Initialize the Database Schema

1. In the Supabase dashboard, go to the "SQL Editor" section
2. Create a new query
3. Copy and paste the entire contents of the `src/db/init_schema.sql` file
4. Click "Run" to execute the SQL and create your database schema

## 4. Set Up Storage

1. Go to the "Storage" section in the Supabase dashboard
2. Click "Create a new bucket"
3. Name it "tarkov-images"
4. Check the box for "Public bucket" (since game images need to be accessible)
5. Click "Create bucket"

## 5. Configure Storage Policies

1. In the "tarkov-images" bucket, click on the "Policies" tab
2. Add a policy for public access:

   - Click "Add policies"
   - Select "Create a policy from scratch"
   - Policy name: "Public Access"
   - Allowed operations: Select "SELECT" only
   - Policy definition: Use `true` (allows anyone to view)
   - Click "Save policy"

3. Add a policy for uploads:
   - Click "Add policies" again
   - Policy name: "Admin Uploads"
   - Allowed operations: Select "INSERT, UPDATE, DELETE"
   - Policy definition: Use `true` (for now - you can restrict this later)
   - Click "Save policy"

## 6. Get Your API Keys

1. Go to "Project Settings" > "API" in the sidebar
2. You'll need:
   - The Supabase URL (`https://[YOUR-PROJECT-ID].supabase.co`)
   - The `anon` public key (starts with `eyJh...`)

## 7. Configure Your Application

1. Open `src/api/supabase.js` in your project
2. Replace the placeholder values:
   ```javascript
   const supabaseUrl = "YOUR_SUPABASE_URL"; // Replace with your Supabase URL
   const supabaseKey = "YOUR_SUPABASE_ANON_KEY"; // Replace with your public API key
   ```

## 8. Initial Data (Optional)

For testing purposes, you might want to add some initial map configuration data:

```sql
-- Insert some sample map configurations
INSERT INTO map_configs (map_name, world_bounds, image_width, image_height)
VALUES
('customs', '{"x1": -1000, "z1": -1000, "x2": 1000, "z2": 1000}', 1024, 1024),
('factory', '{"x1": -500, "z1": -500, "x2": 500, "z2": 500}', 800, 800),
('woods', '{"x1": -1200, "z1": -1200, "x2": 1200, "z2": 1200}', 1200, 1200);
```

Execute this SQL in the SQL Editor if you want to add this sample data.

## 9. Next Steps

After setting up Supabase:

1. Upload some test images via the Admin page at `/admin`
2. Check that your images are properly stored in the Supabase Storage
3. Verify that the database records are created in the `locations` table
4. Test the game by starting a new round on the home page

## Troubleshooting

- **CORS Issues**: If you encounter CORS errors, go to "Authentication" > "URL Configuration" and add your application's URL to the list of allowed sites.
- **Storage Permissions**: If you can't upload or view images, check the bucket policies in the Storage section.
- **Database Errors**: Check the SQL Editor's "Logs" tab for any errors in your queries.

For more help, refer to the [Supabase Documentation](https://supabase.io/docs).
