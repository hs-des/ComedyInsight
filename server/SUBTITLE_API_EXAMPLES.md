# Subtitle API Examples

Complete examples for testing the ComedyInsight subtitle endpoints.

## Base URL

```bash
BASE_URL="http://localhost:3000"
ACCESS_TOKEN="your_jwt_token_here"
```

## 1. Upload Subtitle (Admin)

Upload a subtitle file (.srt or .vtt) for a video.

**Request:**
```bash
curl -X POST ${BASE_URL}/admin/videos/550e8400-e29b-41d4-a716-446655440000/subtitles \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -F "subtitle_file=@/path/to/subtitle.srt" \
  -F "language=en" \
  -F "label=English (US)"
```

**Expected Response:**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "video_id": "550e8400-e29b-41d4-a716-446655440000",
  "language": "en",
  "label": "English (US)",
  "subtitle_url": "http://localhost:3000/subtitles/abc123.vtt",
  "format": "vtt",
  "sync_offset": null,
  "metadata": {
    "originalFormat": "srt",
    "validation": {
      "valid": true,
      "errors": [],
      "warnings": []
    }
  }
}
```

**With Sync Offset:**
```bash
curl -X POST ${BASE_URL}/admin/videos/550e8400-e29b-41d4-a716-446655440000/subtitles \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -F "subtitle_file=@/path/to/subtitle.srt" \
  -F "language=es" \
  -F "label=Spanish" \
  -F "sync_offset=2.5"
```

## 2. Get Subtitles for Video

Get all available subtitles for a video.

**Request:**
```bash
curl ${BASE_URL}/videos/550e8400-e29b-41d4-a716-446655440000/subtitles
```

**Expected Response:**
```json
{
  "subtitles": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "video_id": "550e8400-e29b-41d4-a716-446655440000",
      "language": "en",
      "label": "English (US)",
      "subtitle_url": "http://localhost:3000/subtitles/abc123.vtt",
      "format": "vtt"
    },
    {
      "id": "770e8400-e29b-41d4-a716-446655440001",
      "video_id": "550e8400-e29b-41d4-a716-446655440000",
      "language": "es",
      "label": "Spanish",
      "subtitle_url": "http://localhost:3000/subtitles/def456.vtt",
      "format": "vtt"
    }
  ]
}
```

## 3. Update Subtitle (Admin)

Update subtitle metadata (label, sync_offset, etc.).

**Request:**
```bash
curl -X PUT ${BASE_URL}/admin/subtitles/770e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "English (UK)",
    "sync_offset": 1.5
  }'
```

**Expected Response:**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "video_id": "550e8400-e29b-41d4-a716-446655440000",
  "language": "en",
  "label": "English (UK)",
  "subtitle_url": "http://localhost:3000/subtitles/abc123.vtt",
  "format": "vtt",
  "sync_offset": 1.5
}
```

## 4. Delete Subtitle (Admin)

Delete a subtitle.

**Request:**
```bash
curl -X DELETE ${BASE_URL}/admin/subtitles/770e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

**Expected Response:** `204 No Content`

## 5. Validate Subtitle (Admin)

Validate subtitle file without saving.

**Request:**
```bash
curl -X POST ${BASE_URL}/admin/subtitles/validate \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -F "subtitle_file=@/path/to/subtitle.srt" \
  -F "format=srt"
```

**Expected Response:**
```json
{
  "valid": true,
  "errors": [],
  "warnings": [
    "Segment 5: Gap detected (2.3s)",
    "Segment 12: Text is very long (245 chars)"
  ],
  "duration": 3600.5,
  "segmentCount": 145
}
```

**Invalid File Response:**
```json
{
  "valid": false,
  "errors": [
    "Line 42: Start time must be before end time",
    "Segment 10: Empty subtitle text"
  ],
  "warnings": [
    "Line 15: Non-sequential index (expected 2, got 3)"
  ],
  "duration": 0,
  "segmentCount": 0
}
```

## Sample SRT File

Create a test subtitle file:

**test.srt:**
```
1
00:00:00,000 --> 00:00:03,000
Welcome to ComedyInsight!

2
00:00:03,500 --> 00:00:06,000
Enjoy your viewing experience

3
00:00:07,000 --> 00:00:10,500
Remember to subscribe for more content

4
00:00:12,000 --> 00:00:14,000
Have a great day!
```

## SRT Validation Examples

### Valid SRT
```srt
1
00:00:00,000 --> 00:00:03,000
Line 1 of subtitle text

2
00:00:04,000 --> 00:00:07,000
Line 1
Line 2
```

### Invalid SRT - Bad Timestamp
```srt
1
00:00:03,000 --> 00:00:00,000
Start time after end time

2
00:00:04,000
Missing end time
```

### Invalid SRT - Empty Text
```srt
1
00:00:00,000 --> 00:00:03,000

2
00:00:04,000 --> 00:00:07,000
Valid text
```

## Complete Upload Flow

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"
VIDEO_ID="550e8400-e29b-41d4-a716-446655440000"

echo "1. Uploading English subtitle..."
curl -X POST ${BASE_URL}/admin/videos/${VIDEO_ID}/subtitles \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -F "subtitle_file=@english.srt" \
  -F "language=en" \
  -F "label=English"

echo -e "\n\n2. Uploading Spanish subtitle..."
curl -X POST ${BASE_URL}/admin/videos/${VIDEO_ID}/subtitles \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -F "subtitle_file=@spanish.srt" \
  -F "language=es" \
  -F "label=Español"

echo -e "\n\n3. Retrieving all subtitles..."
curl ${BASE_URL}/videos/${VIDEO_ID}/subtitles

echo -e "\n\nDone!"
```

## Upload Using Multipart Form Data

### JavaScript (Fetch)
```javascript
const formData = new FormData();
formData.append('subtitle_file', fileBlob, 'subtitle.srt');
formData.append('language', 'en');
formData.append('label', 'English');

const response = await fetch(`${BASE_URL}/admin/videos/${videoId}/subtitles`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
  body: formData
});

const result = await response.json();
console.log(result);
```

### Python (Requests)
```python
import requests

url = f"{BASE_URL}/admin/videos/{video_id}/subtitles"
headers = {"Authorization": f"Bearer {access_token}"}

files = {
    'subtitle_file': ('subtitle.srt', open('subtitle.srt', 'rb'), 'text/plain')
}
data = {
    'language': 'en',
    'label': 'English'
}

response = requests.post(url, headers=headers, files=files, data=data)
print(response.json())
```

## Language Codes

Use ISO 639-1 two-letter language codes:

- `en` - English
- `es` - Spanish
- `fr` - French
- `de` - German
- `it` - Italian
- `pt` - Portuguese
- `zh` - Chinese
- `ja` - Japanese
- `ko` - Korean
- `ar` - Arabic

## Sync Offset

`sync_offset` adjusts all timestamps by the specified number of seconds:

- Positive: Subtitles appear later
- Negative: Subtitles appear earlier

Example: If sync_offset = 2.5:
- Original: `00:00:00,000 --> 00:00:03,000`
- Adjusted: `00:00:02,500 --> 00:00:05,500`

## Automatic SRT to VTT Conversion

When uploading a `.srt` file:
1. System parses and validates SRT
2. Converts to VTT format
3. Saves both formats (original + VTT)
4. Serves VTT to clients
5. Stores conversion metadata

## File Formats

### Supported Input
- `.srt` - SubRip Subtitle (converted to VTT)
- `.vtt` - WebVTT (served as-is)

### Output Format
- All subtitles served as `.vtt` (WebVTT standard)

## Error Responses

### Missing File (400)
```json
{
  "error": "Bad Request",
  "message": "Subtitle file is required"
}
```

### Invalid File Type (400)
```json
{
  "error": "Invalid file type. Allowed: .srt, .vtt"
}
```

### Invalid SRT (400)
```json
{
  "error": "INVALID_FILE",
  "message": "Invalid SRT file: Start time must be before end time"
}
```

### Not Found (404)
```json
{
  "error": "NOT_FOUND",
  "message": "Subtitle not found"
}
```

### Unauthorized (401)
```json
{
  "error": "Unauthorized",
  "message": "Authentication token required"
}
```

## Environment Variables

Add to `.env`:

```env
# Subtitle configuration
UPLOAD_DIR=./uploads/subtitles
SUBTITLE_BASE_URL=http://localhost:3000/subtitles

# In production, use cloud storage:
# SUBTITLE_BASE_URL=https://cdn.comedyinsight.com/subtitles
```

## Testing Checklist

- [ ] Upload SRT file
- [ ] Upload VTT file
- [ ] Upload multiple languages
- [ ] Update subtitle metadata
- [ ] Delete subtitle
- [ ] Validate SRT file
- [ ] Get subtitles for video
- [ ] Test sync_offset
- [ ] Test authentication
- [ ] Test file size limit (5MB)
- [ ] Test invalid file type
- [ ] Test invalid SRT format
- [ ] Verify auto-conversion to VTT

## Notes

- Maximum file size: 5MB
- SRT files are automatically converted to VTT
- Timestamps validated during upload
- Gaps/overlaps generate warnings
- All subtitles served as VTT for browser compatibility
- Presigned URLs can be implemented for cloud storage
- Metadata stored as JSONB in database

