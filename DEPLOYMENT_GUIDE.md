# EduGenie Deployment Guide - Video Generation System

## Overview

This guide covers deploying the improved EduGenie video generation system that uses Supabase Storage instead of local filesystem storage, making it deployment-ready without Docker dependencies.

## 🎯 **Key Improvements Made**

### 1. **Removed Heavy Dependencies**

- **Before**: MoviePy, Pydub, local video processing
- **After**: Cloud-based TTS using OpenAI, Supabase Storage

### 2. **Cloud Storage Integration**

- **Before**: Local filesystem (`backend/static/generated_videos/`)
- **After**: Supabase Storage with CDN delivery

### 3. **Genie Integration**

- **Before**: Video generation only in `/chat`
- **After**: `@video` command available in genies chat

### 4. **Deployment Ready**

- **Before**: Required Docker for heavy dependencies
- **After**: Standard Python deployment without Docker

## 🚀 **Deployment Steps**

### 1. **Environment Setup**

Create a `.env` file in the backend directory:

```bash
# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key

# Other existing environment variables...
```

### 2. **Supabase Storage Setup**

#### Create Storage Bucket:

1. Go to your Supabase dashboard
2. Navigate to Storage
3. Create a bucket named `generated-videos` (or let the app create it automatically)
4. **Important**: Set bucket to **Public** manually in the Supabase dashboard
   - Click on the bucket → Settings → Make bucket public
5. Configure RLS policies if needed

**Note**: The Python API creates private buckets by default. You must manually make the bucket public in the Supabase dashboard for video URLs to be accessible.

#### Storage Policies (Optional):

```sql
-- Allow authenticated users to upload videos
CREATE POLICY "Allow authenticated upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'generated-videos'
  AND auth.role() = 'authenticated'
);

-- Allow public read access to videos
CREATE POLICY "Allow public read" ON storage.objects
FOR SELECT USING (bucket_id = 'generated-videos');
```

### 3. **Backend Deployment**

#### Option A: Railway/Render/Vercel

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables in your platform
# Deploy using your platform's CLI or git integration
```

#### Option B: Traditional Server

```bash
# Install dependencies
pip install -r requirements.txt

# Run with Gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 main:app
```

#### Option C: Serverless (AWS Lambda/Google Cloud Functions)

```bash
# The lightweight approach makes serverless deployment viable
# Follow your serverless platform's Python deployment guide
```

### 4. **Frontend Deployment**

#### Update Environment Variables:

```bash
# .env.local
NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.com
```

#### Deploy:

```bash
npm run build
npm start
# Or deploy to Vercel/Netlify
```

## 📱 **How to Use Video Generation**

### In Chat Page (`/chat`):

1. Enter text in the video generator
2. Click "Generate Video"
3. Video is processed and stored in Supabase
4. Video URL is returned for playback

### In Genies (`/genies/[id]`):

1. Type `@video` to trigger autocomplete
2. Add your content: `@video explain photosynthesis`
3. AI generates video content and stores in Supabase
4. Video appears in chat with player controls

## 🔧 **Technical Architecture**

### Video Generation Flow:

```
User Input → OpenAI TTS → Supabase Storage → Public CDN URL → Frontend Display
```

### Components:

1. **OpenAI TTS**: Converts text to speech
2. **Supabase Storage**: Stores video/audio files
3. **CDN Delivery**: Fast global content delivery
4. **Frontend Player**: HTML5 video player with controls

## 🛠 **Troubleshooting**

### Common Issues:

#### 1. **Bucket Creation Fails**

```python
# Ensure Supabase client has proper permissions
# Check environment variables are set correctly
```

#### 2. **Video Upload Fails**

```python
# Check file size limits (Supabase: 50MB default)
# Verify bucket exists and is public
# Check API keys and permissions
```

#### 3. **Video URL Not Accessible**

```sql
-- Check bucket is public
SELECT * FROM storage.buckets WHERE name = 'generated-videos';

-- Verify RLS policies allow access
```

### Monitoring:

```python
# Add logging for debugging
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Log video generation steps
logger.info(f"Starting video generation for text: {text[:50]}...")
```

## 🎨 **Customization Options**

### 1. **Video Generation Services**

Replace the current TTS-only approach with:

- **Synthesia API**: AI avatar videos
- **D-ID API**: Talking head videos
- **RunwayML**: AI video generation
- **Luma AI**: Text-to-video generation

### 2. **Storage Options**

Alternative to Supabase:

- **AWS S3 + CloudFront**
- **Google Cloud Storage**
- **Azure Blob Storage**
- **Cloudinary**

### 3. **Enhanced Features**

- Background video generation (async processing)
- Video thumbnails
- Video transcription
- Multiple voice options
- Video templates

## 📊 **Performance Considerations**

### Optimization Tips:

1. **Async Processing**: Implement background jobs for long videos
2. **Caching**: Cache frequently requested videos
3. **Compression**: Optimize video size/quality balance
4. **CDN**: Leverage Supabase's global CDN
5. **Monitoring**: Track generation times and failures

### Scaling:

```python
# For high-volume deployments, consider:
# - Queue systems (Celery, RQ)
# - Multiple workers
# - Rate limiting
# - Error retry logic
```

## 🔒 **Security Best Practices**

1. **API Keys**: Use environment variables, never commit keys
2. **Rate Limiting**: Implement user/IP rate limits
3. **Content Filtering**: Validate input text
4. **Storage Policies**: Configure proper RLS policies
5. **CORS**: Configure CORS for your domains only

## 💰 **Cost Optimization**

### OpenAI TTS Costs:

- **Standard Voice**: $15/1M characters
- **HD Voice**: $30/1M characters

### Supabase Storage Costs:

- **Storage**: $0.021/GB/month
- **Bandwidth**: $0.09/GB

### Tips:

- Cache popular videos
- Implement text length limits
- Use standard voice for non-critical content
- Monitor usage with analytics

## 🚨 **Migration from Old System**

If you have existing videos in the old system:

### 1. **Backup Existing Videos**

```bash
# Copy videos from backend/static/generated_videos/
cp -r backend/static/generated_videos/ backup/
```

### 2. **Upload to Supabase**

```python
# Script to migrate existing videos
import os
from supabase import create_client

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

for filename in os.listdir('backup/'):
    with open(f'backup/{filename}', 'rb') as f:
        supabase.storage.from_('generated-videos').upload(filename, f)
```

### 3. **Update Database References**

```sql
-- Update any database records that reference old video paths
UPDATE table_name
SET video_url = REPLACE(video_url, '/static/generated_videos/', 'supabase_storage_url')
```

## ✅ **Deployment Checklist**

- [ ] Environment variables configured
- [ ] Supabase bucket created and public
- [ ] OpenAI API key active with sufficient credits
- [ ] Backend deployed and accessible
- [ ] Frontend deployed with correct API URL
- [ ] Video generation tested in both `/chat` and `/genies`
- [ ] Error logging configured
- [ ] Monitoring set up
- [ ] Rate limiting implemented
- [ ] Security policies reviewed

## 📞 **Support**

For deployment issues:

1. Check logs in your deployment platform
2. Verify environment variables
3. Test API endpoints manually
4. Check Supabase dashboard for errors
5. Monitor OpenAI API usage

---

**🎉 Your video generation system is now deployment-ready without Docker dependencies!**
