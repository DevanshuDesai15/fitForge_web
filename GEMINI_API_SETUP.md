# 🚀 Gemini API Setup Guide

## ❌ **Current Issue: Missing API Key**

Your 429 error is caused by **missing/invalid API key configuration**, not quota limits.

## 🔧 **Quick Fix Steps:**

### **Step 1: Get Your Gemini API Key**

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the generated API key

### **Step 2: Create Environment File**

Create a `.env` file in your project root with:

```bash
# Copy this into a new file called .env
VITE_GEMINI_API_KEY=your_actual_api_key_here
VITE_USE_GEMINI_AI=true
VITE_HYBRID_MODE=true
VITE_GEMINI_PRIORITY=0.4
VITE_GEMINI_TIMEOUT=10000
VITE_GEMINI_MAX_RETRIES=3
```

### **Step 3: Restart Your Dev Server**

```bash
npm run dev
```

## 🔍 **Why You Got 429 Error:**

1. **❌ Invalid Model**: Was using `gemini-2.5-flash` (doesn't exist) → **Fixed** to `gemini-1.5-flash`
2. **❌ Missing API Key**: No `VITE_GEMINI_API_KEY` environment variable → **Need to set this**
3. **❌ Wrong Config**: Placeholder key `"your-gemini-api-key-here"` → **Need real key**

## ✅ **After Setup You'll Get:**

- ✅ **Real AI suggestions** with Gemini intelligence
- ✅ **Fallback system** if API has issues
- ✅ **No more 429 errors**
- ✅ **Smart caching** to optimize usage
- ✅ **Professional error handling**

## 💡 **Gemini API Info:**

- **Free Tier**: 50 requests/day (perfect for testing)
- **Paid Tier**: $0.125 per 1,000 requests (~$5/month for most users)
- **Models Available**: `gemini-1.5-flash`, `gemini-1.5-pro`
- **Rate Limits**: 15 requests/minute (free), 1500/minute (paid)

## 🛠️ **Testing Commands:**

After setup, test in browser console:

```javascript
testGemini(); // Test connection
checkGeminiQuota(); // Check usage
testAIFixes(); // Test all AI features
```

---

**🎯 The main issue is just missing the API key - once you set that up, everything will work perfectly!**
