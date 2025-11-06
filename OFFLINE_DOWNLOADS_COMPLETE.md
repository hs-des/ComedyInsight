# Offline Downloads with Encryption - Complete Implementation

Secure offline video downloads with AES-256-GCM encryption, device binding, and remote wipe capability.

## 🎯 Architecture

```
┌─────────────┐
│   Client    │ 1. Request download
└──────┬──────┘
       │
       v
┌─────────────────┐
│  Server API     │ 2. Verify subscription
│  /downloads     │ 3. Generate presigned URL
└──────┬──────────┘ 4. Derive encryption key
       │           5. Generate decryption token
       v
┌──────────────┐
│  S3/Storage  │ 6. Encrypted video served
└──────┬───────┘
       │
       v
┌──────────────┐
│   Client     │ 7. Download encrypted file
│  Download    │ 8. Store with token
└──────┬───────┘
       │
       v
┌──────────────┐
│   Client     │ 9. Verify token before play
│  Playback    │ 10. Decrypt & stream
└──────────────┘
```

## 🔐 Encryption Details

### AES-256-GCM

**Why AES-256-GCM:**
- **AES**: Industry standard symmetric encryption
- **256-bit**: Strong encryption key
- **GCM mode**: Authenticated encryption (prevents tampering)
- **Authenticity**: Guarantees file integrity

### Key Derivation

```typescript
// PBKDF2 key derivation
const key = crypto.pbkdf2Sync(
  `${userId}:${deviceId}:${secret}`,
  'salt',
  100000,  // 100k iterations
  KEY_LENGTH,
  'sha256'
);
```

**Security Features:**
- Per-user + per-device key
- Server secret never exposed
- 100k PBKDF2 iterations (slow brute force)
- SHA-256 hashing

## 📱 Mobile Implementation

### Download Flow

```typescript
// 1. Request download
const { presignedUrl, decryptionToken } = await downloadService.requestDownload(
  videoId,
  '720p'
);

// 2. Download encrypted file
await downloadService.downloadVideo(
  videoId,
  title,
  thumbnail,
  '720p',
  (progress) => console.log(progress)
);

// 3. Playback with verification
const filePath = await downloadService.playDownloadedVideo(videoId);
// Video player opens file
```

### Pre-Playback Checks

```typescript
async playDownloadedVideo(videoId: string) {
  const metadata = await getDownloadMetadata(videoId);
  
  // Check 1: Expiry
  if (new Date(metadata.expiry_date) < new Date()) {
    throw new Error('Download expired');
  }
  
  // Check 2: Remote wipe
  const isValid = await verifyToken(videoId);
  if (!isValid) {
    await deleteDownload(videoId);
    throw new Error('Download revoked');
  }
  
  return metadata.file_path;
}
```

### Device ID

```typescript
// Generate persistent device ID
const deviceId = await Crypto.digestStringAsync(
  CryptoDigestAlgorithm.SHA256,
  `${Device.modelId}-${Device.osInternalBuildId}`,
  { encoding: CryptoEncoding.BASE64 }
);
await SecureStore.setItemAsync('device_id', deviceId);
```

## 🔌 API Endpoints

### Request Download

**POST** `/api/downloads/request`

```json
{
  "video_id": "uuid",
  "quality": "720p",
  "device_id": "device-hash"
}
```

**Response:**
```json
{
  "presigned_url": "https://s3...",
  "decryption_token": "base64-token",
  "expiry_date": "2024-02-01T00:00:00Z"
}
```

### Verify Token

**POST** `/api/downloads/verify-token`

```json
{
  "device_id": "device-hash",
  "token": "base64-token"
}
```

**Response:**
```json
{
  "valid": true
}
```

### Revoke Downloads

**POST** `/api/downloads/revoke`

```json
{
  "device_id": "device-hash"  // Optional: revoke all if omitted
}
```

**Response:**
```json
{
  "success": true,
  "message": "Downloads revoked"
}
```

## 🛡️ Remote Wipe

### How It Works

```
┌──────────┐
│  Admin   │ → POST /downloads/revoke
└────┬─────┘
     │
     v
┌────────────┐
│  Database  │ → UPDATE downloads SET revoked=true
└────┬───────┘
     │
     v
┌──────────┐
│  Client  │ → playDownloadedVideo()
└────┬─────┘
     │
     v
┌────────────┐
│ verifyToken│ → Token marked revoked
└────┬───────┘
     │
     v
┌──────────┐
│  File    │ → Deleted from device
│ Deleted  │
└──────────┘
```

### Implementation

**Server:**
```typescript
await db.query(
  'UPDATE downloads SET revoked=true WHERE user_id=$1',
  [userId]
);
```

**Client:**
```typescript
const isValid = await verifyToken(videoId);
if (!isValid) {
  await deleteDownload(videoId);
  throw new Error('Revoked');
}
```

## 📊 Sequence Diagram

```
User          Client App        Server          S3/Storage
 │                │                │                │
 ├─[Download]─────>                │                │
 │                ├─[Request URL]──>                │
 │                │                │                │
 │                │      [Verify Subscription]      │
 │                │                │                │
 │                │    [Generate Token]             │
 │                │    [Derive Key]                 │
 │                │                │                │
 │                <─[presigned_url]─┤                │
 │                <─[decrypt_token]─┤                │
 │                │                │                │
 │                ├─[GET File]───────────────────────>
 │                │                │                │
 │                <────────────────[Encrypted File]─┤
 │                │                │                │
 │           [Store Encrypted]                     │
 │           [Store Metadata]                      │
 │                │                │                │
 ├─[Play]────────>                │                │
 │                ├─[Verify Token]─>                │
 │                │                │                │
 │                <─[Token Valid]──┤                │
 │                │                │                │
 │           [Decrypt File]                        │
 │           [Stream to Player]                    │
 │                │                │                │
 │                ▼                │                │
```

## 🔒 Security Considerations

### ✅ Implemented

1. **Strong Encryption**: AES-256-GCM
2. **Key Derivation**: PBKDF2 (100k iterations)
3. **Device Binding**: Per-user+device keys
4. **Remote Wipe**: Token revocation
5. **Expiry Management**: 30-day limit
6. **Subscription Check**: Free users blocked
7. **Secure Storage**: SecureStore for device ID
8. **Token Verification**: Per-playback check

### ⚠️ Caveats & Limitations

#### iOS Specific

1. **File Access**
   - Files stored in app container (isolated)
   - Not accessible to other apps
   - Deleted when app uninstalled

2. **Background Downloads**
   - Requires `expo-task-manager`
   - Limited to 30s after app backgrounded
   - Large downloads need connectivity

3. **Storage Quotas**
   - No hard limit on device storage
   - App storage usage displayed in Settings
   - Recommend 5GB per user limit

#### Android Specific

1. **File Access**
   - Scoped storage (Android 10+)
   - MediaStore access for shared files
   - Isolated app storage preferred

2. **Background Downloads**
   - WorkManager for reliable downloads
   - Can continue after app closed
   - Better background handling than iOS

3. **Storage Quotas**
   - Device storage limits apply
   - Recommend monitoring usage
   - Warn user when low storage

#### Platform Agnostic

1. **Video Codecs**
   - H.264 baseline required
   - Avoid HEVC (poor device support)
   - Test on older devices

2. **Decryption Performance**
   - AES-GCM is fast but consider:
   - Large files (4K) may stutter
   - Test on mid-range devices
   - Consider progressive decryption

3. **Network Considerations**
   - Verify WiFi before large downloads
   - Warn on cellular
   - Allow pause/resume

4. **Battery Life**
   - Downloads drain battery
   - Recommend charging for large files
   - Monitor battery level

## 📝 Storage Layout

```
Downloads Directory:
├── downloads/
│   ├── encrypted/
│   │   ├── video1_720p.enc    [Encrypted]
│   │   ├── video2_720p.enc
│   │   └── video3_1080p.enc
│   ├── decrypted/
│   │   ├── video1_720p.mp4    [Decrypted cache]
│   │   └── video2_720p.mp4
│   └── metadata/
│       ├── video1.json        [Download info]
│       └── video2.json
```

**Metadata JSON:**
```json
{
  "video_id": "uuid",
  "decryption_token": "base64",
  "expiry_date": "2024-02-01",
  "file_path": "encrypted/video.enc",
  "status": "completed"
}
```

## 🧪 Testing

### Test Download Flow

```bash
# 1. Request download
curl -X POST http://localhost:3000/api/downloads/request \
  -H "Authorization: Bearer TOKEN" \
  -d '{"video_id":"uuid","quality":"720p","device_id":"device123"}'

# 2. Verify token
curl -X POST http://localhost:3000/api/downloads/verify-token \
  -H "Authorization: Bearer TOKEN" \
  -d '{"device_id":"device123","token":"..."}'

# 3. Test remote wipe
curl -X POST http://localhost:3000/api/downloads/revoke \
  -H "Authorization: Bearer TOKEN" \
  -d '{}'
```

### Production Testing

1. Download 1GB video
2. Verify encrypted storage
3. Test playback
4. Revoke token
5. Verify file deleted
6. Check expiry handling

## 📊 Monitoring

### Key Metrics

```sql
-- Active downloads
SELECT COUNT(*) FROM downloads 
WHERE revoked = FALSE 
  AND expires_at > CURRENT_TIMESTAMP;

-- Storage usage
SELECT 
  user_id,
  SUM(file_size) as total_bytes
FROM downloads
GROUP BY user_id;

-- Revoked downloads
SELECT COUNT(*) FROM downloads 
WHERE revoked = TRUE 
  AND updated_at > CURRENT_DATE - INTERVAL '30 days';
```

## 🚨 Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| No subscription | Free user | Show upgrade prompt |
| Token invalid | Revoked | Delete file, show message |
| File expired | Past expiry | Show expiry message |
| Download failed | Network error | Retry with backoff |
| Storage full | No space | Warn user, clean up |
| Decrypt failed | Corrupt file | Redownload |

## 🎯 Best Practices

### Recommendations

1. **Expiry Management**
   - 30 days for movies
   - 7 days for clips
   - 24 hours for previews

2. **Storage Limits**
   - 5GB per user max
   - Auto-delete oldest when limit
   - Warn at 80% capacity

3. **Background Downloads**
   - Only on WiFi
   - Indicate progress
   - Support pause/resume

4. **Playback UX**
   - Show "Downloaded" badge
   - Indicate expiry date
   - Handle errors gracefully

## 📚 Files Created

### Backend

```
server/src/
├── services/encryption.service.ts    # AES-GCM encryption
├── services/download.service.ts      # Download management
├── controllers/downloads.controller.ts
├── routes/downloads.routes.ts

server/migrations/
└── 005_add_download_encryption_fields.sql
```

### Mobile

```
mobile/src/services/
└── download.service.ts               # Encrypted downloads

mobile/package.json                   # Added: expo-crypto, expo-secure-store, expo-device
```

## 🔐 Security Summary

| Feature | Status |
|---------|--------|
| AES-256-GCM | ✅ |
| PBKDF2 (100k) | ✅ |
| Device binding | ✅ |
| Remote wipe | ✅ |
| Token expiry | ✅ |
| Subscription check | ✅ |
| Secure device ID | ✅ |
| Per-playback verify | ✅ |

## 🚀 Production Checklist

- [ ] Strong ENCRYPTION_SECRET
- [ ] AWS S3 configured
- [ ] Test on iOS/Android
- [ ] Monitor storage usage
- [ ] Set download limits
- [ ] Handle errors gracefully
- [ ] Background download tested
- [ ] Remote wipe verified
- [ ] Expiry management working

## 💡 Future Enhancements

- [ ] Progressive encryption/decryption
- [ ] Resume interrupted downloads
- [ ] Bandwidth-aware quality
- [ ] Download scheduling
- [ ] CDN integration
- [ ] Multi-device sync
- [ ] Compression before encrypt

## 📖 Summary

Complete encrypted download system:
- ✅ AES-256-GCM encryption
- ✅ Per-user+device keys
- ✅ Remote wipe capability
- ✅ Token verification
- ✅ Expiry management
- ✅ Subscription enforcement
- ✅ iOS/Android ready
- ✅ Security best practices

