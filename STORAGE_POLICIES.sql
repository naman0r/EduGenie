-- Supabase Storage RLS Policies for EduGenie Video Generation System
-- This file contains the Row Level Security policies needed for storage operations

-- =====================================================
-- STORAGE POLICIES FOR generated-videos BUCKET
-- =====================================================

-- Enable RLS on storage.objects (it should already be enabled, but just in case)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow public INSERT for video generation system
-- This allows the backend to upload video files
CREATE POLICY "Allow video uploads" ON storage.objects
  FOR INSERT 
  WITH CHECK (bucket_id = 'generated-videos');

-- Policy 2: Allow public SELECT for accessing uploaded videos
-- This allows anyone to access generated videos via public URLs
CREATE POLICY "Allow video access" ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'generated-videos');

-- Policy 3: Allow UPDATE for video metadata (optional, for future use)
CREATE POLICY "Allow video updates" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'generated-videos')
  WITH CHECK (bucket_id = 'generated-videos');

-- Policy 4: Allow DELETE for cleanup (optional, for future use)
CREATE POLICY "Allow video deletion" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'generated-videos');

-- =====================================================
-- ALTERNATIVE: More restrictive policies (authenticated users only)
-- =====================================================
-- Uncomment these and comment out the above if you want to restrict access to authenticated users only

/*
-- Policy 1: Allow authenticated users to upload videos
CREATE POLICY "Allow authenticated video uploads" ON storage.objects
  FOR INSERT 
  TO authenticated
  WITH CHECK (bucket_id = 'generated-videos');

-- Policy 2: Allow authenticated users to access videos
CREATE POLICY "Allow authenticated video access" ON storage.objects
  FOR SELECT 
  TO authenticated
  USING (bucket_id = 'generated-videos');

-- Policy 3: Allow users to access only their own uploaded videos
CREATE POLICY "Allow user own video access" ON storage.objects
  FOR SELECT 
  TO authenticated
  USING (
    bucket_id = 'generated-videos' 
    AND (storage.foldername(name))[1] = (auth.uid()::text)
  );
*/

-- =====================================================
-- BUCKET POLICIES (if using RLS on storage.buckets)
-- =====================================================

-- Enable RLS on storage.buckets (if not already enabled)
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Allow public access to the generated-videos bucket metadata
CREATE POLICY "Allow access to generated-videos bucket" ON storage.buckets
  FOR SELECT 
  USING (id = 'generated-videos');

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these queries to verify your setup:

/*
-- Check if policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Check bucket status
SELECT id, name, public, created_at 
FROM storage.buckets 
WHERE id = 'generated-videos';

-- Test upload permissions (run from your application)
-- This should work if policies are correctly set up

-- Test file access (check if you can access uploaded files)
SELECT name, bucket_id, created_at 
FROM storage.objects 
WHERE bucket_id = 'generated-videos' 
LIMIT 5;
*/ 