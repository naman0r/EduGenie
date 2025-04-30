from flask import Blueprint, request, jsonify, abort, current_app
import os
import uuid
import json
from openai import OpenAI, APIError
from moviepy.editor import (TextClip, ColorClip, AudioFileClip,
                            CompositeVideoClip, concatenate_audioclips)
from pydub import AudioSegment # Or use mutagen
import logging
import shutil # For cleaning up temp files

# Initialize client (assuming OPENAI_API_KEY is set)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = None
if OPENAI_API_KEY:
    client = OpenAI(api_key=OPENAI_API_KEY)

bp = Blueprint('video', __name__, url_prefix='/chat')
logger = logging.getLogger(__name__)

# --- Constants ---
# Define paths relative to the backend directory
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMP_DIR = os.path.join(BACKEND_DIR, "temp_video_files")
OUTPUT_DIR = os.path.join(BACKEND_DIR, "static/generated_videos") # Served via /static/generated_videos/...
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# --- Helper Function ---
def get_audio_duration_ms(filepath):
    try:
        audio = AudioSegment.from_file(filepath)
        return len(audio)
    except Exception as e:
        logger.error(f"Error getting duration for {filepath}: {e}")
        return 0

# --- Route ---
@bp.route('/generate-video', methods=['POST'])
def generate_video_route():
    if not client:
         abort(500, description="OpenAI client not initialized. Check API key.")

    data = request.get_json()
    input_text = data.get('text')
    if not input_text:
        abort(400, description="Missing 'text' in request body.")

    job_id = str(uuid.uuid4())
    job_temp_dir = os.path.join(TEMP_DIR, job_id)
    os.makedirs(job_temp_dir, exist_ok=True)
    logger.info(f"[{job_id}] Starting video generation. Temp dir: {job_temp_dir}")

    audio_clips = [] # Keep track of moviepy clips to close later
    try:
        # === Step 1: Generate Script ===
        logger.info(f"[{job_id}] Generating script...")
        script_prompt = f"""Based on the following text, create a  script suitable for an explanatory video. Break the script down into short, narratable sentences, with each sentence on a new line. Output only the script lines, nothing else.

TEXT:
{input_text}"""
        completion = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful scriptwriter."},
                {"role": "user", "content": script_prompt}
            ]
        )
        script_text = completion.choices[0].message.content or ""
        script_lines = [line.strip() for line in script_text.split('\n') if line.strip()] # Use \n for newline in response
        logger.info(f"[{job_id}] Script generated with {len(script_lines)} lines.")

        if not script_lines:
            logger.error(f"[{job_id}] No script lines generated from text: {script_text}")
            abort(500, description="Failed to generate a valid script from the AI.")

        # === Step 2 & 3: Generate TTS Audio and Get Timings ===
        logger.info(f"[{job_id}] Generating TTS audio...")
        timed_captions = [] # List of dicts: {"text": ..., "start": sec, "end": sec}
        current_time_ms = 0
        audio_file_paths = [] # Keep track of files for concatenation

        for i, line in enumerate(script_lines):
            audio_filename = os.path.join(job_temp_dir, f"line_{i}.mp3")
            try:
                logger.debug(f"[{job_id}] Generating TTS for line {i}: '{line[:50]}...'")
                response = client.audio.speech.create(
                    model="tts-1",
                    voice="alloy",
                    input=line,
                )
                response.stream_to_file(audio_filename)
                logger.debug(f"[{job_id}] Saved TTS file: {audio_filename}")

                duration_ms = get_audio_duration_ms(audio_filename)
                if duration_ms == 0:
                    logger.warning(f"[{job_id}] Could not get duration for {audio_filename}, skipping line.")
                    continue

                audio_file_paths.append(audio_filename)
                start_ms = current_time_ms
                end_ms = current_time_ms + duration_ms
                timed_captions.append({"text": line, "start": start_ms / 1000.0, "end": end_ms / 1000.0})
                current_time_ms = end_ms
                logger.debug(f"[{job_id}] Line {i} timing: {start_ms/1000.0:.2f}s - {end_ms/1000.0:.2f}s")

            except APIError as e:
                logger.error(f"[{job_id}] OpenAI TTS API error for line {i}: {e}")
                continue
            except Exception as e:
                logger.error(f"[{job_id}] Error processing TTS for line {i}: {e}")
                continue

        if not audio_file_paths:
             logger.error(f"[{job_id}] No audio files were successfully generated.")
             abort(500, description="Failed to generate any audio clips for the video.")

        # Concatenate audio using moviepy AFTER durations are known
        logger.info(f"[{job_id}] Concatenating {len(audio_file_paths)} audio files...")
        audio_clips = [AudioFileClip(f) for f in audio_file_paths]
        final_audio = concatenate_audioclips(audio_clips)
        total_duration_sec = final_audio.duration # Use duration from concatenated clip
        logger.info(f"[{job_id}] TTS concatenation complete. Total duration: {total_duration_sec:.2f}s")

        # === Step 4: Render Video ===
        logger.info(f"[{job_id}] Rendering video...")
        video_size = (640, 360)
        bg_clip = ColorClip(size=video_size, color=(0, 0, 0), duration=total_duration_sec)

        caption_clips = []
        # Ensure font path is correct or font is globally available
        font_path = 'Arial.ttf' # Example: Use a specific path if needed '/Library/Fonts/Arial.ttf'
        try:
             # Attempt to create a dummy clip to check font availability early
             TextClip("test", fontsize=1, color='black', font=font_path)
             logger.info(f"[{job_id}] Font '{font_path}' seems available.")
        except Exception as font_error:
             logger.error(f"[{job_id}] FONT ERROR: Font '{font_path}' not found or invalid. Check installation. Error: {font_error}")
             # Fallback font or abort
             font_path='Helvetica' # Common fallback, but still might fail
             logger.warning(f"[{job_id}] Attempting fallback font: '{font_path}'")
             try:
                 TextClip("test", fontsize=1, color='black', font=font_path)
             except Exception:
                  abort(500, description=f"Required font '{font_path}' or fallback not found on server.")


        for caption in timed_captions:
            txt_clip = TextClip(caption["text"], fontsize=24, color='white',
                                font=font_path,
                                size=(video_size[0]*0.9, None),
                                method='caption', align='West', stroke_color='black', stroke_width=0.5)
            txt_clip = txt_clip.set_position(('center', 0.8), relative=True) # Position near bottom center
            txt_clip = txt_clip.set_start(caption["start"]).set_duration(caption["end"] - caption["start"])
            caption_clips.append(txt_clip)

        logger.debug(f"[{job_id}] Created {len(caption_clips)} caption clips.")
        video = CompositeVideoClip([bg_clip] + caption_clips, size=video_size)
        video = video.set_audio(final_audio)

        output_filename = f"{job_id}.mp4"
        output_path = os.path.join(OUTPUT_DIR, output_filename)

        logger.info(f"[{job_id}] Writing video file to: {output_path} ...")
        # Use fewer threads for potentially lower memory usage, disable progress bar for cleaner logs
        video.write_videofile(output_path,
                              codec='libx264',
                              audio_codec='aac',
                              temp_audiofile=os.path.join(job_temp_dir, 'temp-audio.m4a'),
                              remove_temp=True,
                              threads=2,
                              logger=None, # Set to 'bar' for progress
                              preset='ultrafast',
                              fps=24 # Explicitly set the frames per second
                              )
        logger.info(f"[{job_id}] Video rendering complete: {output_path}")


        # === Step 5: Return URL ===
        # Assumes OUTPUT_DIR's parent ('static') is served
        video_url = f"/static/generated_videos/{output_filename}"

        return jsonify({"message": "Video generated successfully", "video_url": video_url})

    except APIError as e:
        logger.error(f"[{job_id}] OpenAI API error: {e}")
        abort(502, description=f"AI service error: {e.message}")
    except Exception as e:
        logger.error(f"[{job_id}] General error in video generation: {e}")
        import traceback
        logger.error(traceback.format_exc())
        abort(500, description=f"Failed to generate video. Check server logs. Error: {str(e)}")
    finally:
        # Ensure moviepy clips release file handles before cleanup
        for clip in audio_clips:
            try:
                clip.close()
            except Exception: pass # Ignore errors during cleanup
        if 'final_audio' in locals() and final_audio:
            try:
                final_audio.close()
            except Exception: pass
        if 'video' in locals() and video:
             try:
                 video.close()
             except Exception: pass

        # Clean up temporary directory for this job
        if os.path.exists(job_temp_dir):
            try:
                shutil.rmtree(job_temp_dir)
                logger.info(f"[{job_id}] Cleaned up temp directory.")
            except Exception as e:
                logger.error(f"[{job_id}] Error cleaning up temp dir {job_temp_dir}: {e}")

# No </rewritten_file> tag here 