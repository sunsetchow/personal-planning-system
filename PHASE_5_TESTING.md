# Phase 5: AI Integration Testing Guide

This document provides comprehensive testing instructions for the AI features implemented in Phase 5.

## Prerequisites

1. **Backend server running** on http://localhost:5000
2. **Frontend server running** on http://localhost:3000
3. **Valid user account** created
4. **Authentication token** (get from browser localStorage after login)
5. **ANTHROPIC_API_KEY** configured in `backend/.env`

## Getting Your Auth Token

1. Open your browser to http://localhost:3000
2. Login to your account
3. Open Browser DevTools (F12) → Console
4. Run: `localStorage.getItem('token')`
5. Copy the token value (without quotes)

## Test 1: AI Journal Entry Analysis

**Purpose:** Test Claude's ability to analyze journal content and provide feedback

```bash
# Replace YOUR_TOKEN with your actual JWT token
curl -X POST http://localhost:5000/api/ai/analyze-entry \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "content": "Today was productive! I completed 3 key features for my project and went for a 5km run. Feeling accomplished but a bit tired.",
    "moodScore": 8,
    "energyScore": 6
  }'
```

**Expected Response:**
```json
{
  "feedback": "Great work on balancing productivity with physical wellness! Completing 3 features shows strong focus, and your 5km run demonstrates commitment to health..."
}
```

## Test 2: OKR Update Suggestions

**Purpose:** Test Claude's ability to detect progress mentions and suggest OKR updates

### Prerequisites:
- Create at least one objective with key results
- Example: "Improve Fitness" with KR "Run 100km this quarter"

```bash
curl -X POST http://localhost:5000/api/ai/suggest-okr-updates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "journalContent": "Went for a great 5km run today! That brings my monthly total to 25km. Also completed the design mockups for the new dashboard."
  }'
```

**Expected Response:**
```json
{
  "suggestions": [
    {
      "objectiveId": "uuid-here",
      "keyResultId": "uuid-here",
      "suggestedValue": 25,
      "reasoning": "Journal mentions running 5km today with a monthly total of 25km"
    }
  ]
}
```

## Test 3: AI Insights Generation

**Purpose:** Test Claude's ability to analyze patterns and generate insights

### Prerequisites:
- At least 3-5 journal entries created
- At least 1 objective with progress

```bash
curl -X GET http://localhost:5000/api/ai/insights \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "insights": "Your energy levels have been consistently high at 7.5/10 over the past week, and you're making solid progress on your goals with 65% average completion. Consider maintaining this momentum by..."
}
```

## Test 4: Key Result Suggestions

**Purpose:** Test Claude's ability to suggest measurable KRs for objectives

```bash
curl -X POST http://localhost:5000/api/ai/suggest-key-results \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "objectiveTitle": "Improve Physical Health"
  }'
```

**Expected Response:**
```json
{
  "suggestions": [
    "Run 100km total distance",
    "Complete 12 strength training sessions",
    "Reduce body fat percentage from 20% to 15%"
  ]
}
```

## Test 5: Error Handling - No API Key

**Purpose:** Verify graceful degradation when ANTHROPIC_API_KEY is not set

1. Remove or comment out `ANTHROPIC_API_KEY` from `backend/.env`
2. Restart backend server
3. Run any AI endpoint test above

**Expected Behavior:**
- Should return graceful fallback message
- Should NOT crash the server
- Example: `"AI analysis is not available. Please configure ANTHROPIC_API_KEY."`

## Test 6: Frontend Integration Test

### Dashboard AI Insights

1. Navigate to http://localhost:3000/dashboard
2. Login if needed
3. Create at least 1 OKR and 1 journal entry
4. Refresh the dashboard

**Expected Behavior:**
- "Orbit AI Insights" panel should show loading animation
- After ~2-5 seconds, AI-generated insights should appear
- Insights should be relevant to your data

### Dashboard Stats

1. Check the three stat cards at the top
2. Verify they show real data:
   - **Avg. Progress**: Should reflect actual OKR completion
   - **Active Goals**: Should count non-completed objectives
   - **Recent Energy**: Should show last journal entry's energy score

## Test 7: End-to-End AI Workflow

Complete user journey:

1. **Create an Objective**
   - Go to /dashboard/okrs/new
   - Title: "Launch New Product"
   - Add 2-3 key results

2. **Write a Journal Entry**
   - Go to /dashboard/journal/entries/new
   - Mention specific progress on your objectives
   - Example: "Made great progress today! Completed the API endpoints and wrote 15 unit tests. Only 5 more tests to go to reach my goal of 20 tests."

3. **Check for AI Suggestions**
   - Backend should analyze the entry
   - If progress is detected, suggestions should be logged
   - Frontend will show AI feedback in the entry

4. **View Dashboard Insights**
   - Navigate back to /dashboard
   - AI Insights panel should show personalized analysis
   - Stats should be updated

## Common Issues

### Issue: "AI analysis is not available"
**Solution:** Add ANTHROPIC_API_KEY to backend/.env

### Issue: "Failed to load AI insights"
**Solution:** Check backend logs for Claude API errors, verify API key is valid

### Issue: Empty suggestions array
**Solution:** This is normal if journal content doesn't mention specific progress. Try more explicit mentions like "completed 5 tasks" or "ran 10km"

### Issue: TypeScript errors
**Solution:** Run `npm install` in both backend and frontend directories

## Success Criteria

Phase 5 is working correctly if:

✅ All TypeScript compiles without errors
✅ Backend server starts successfully with/without API key
✅ All 4 AI endpoints respond without crashes
✅ Dashboard loads and shows real stats
✅ AI Insights panel displays Claude-generated content
✅ Error handling works gracefully when API key missing
✅ Journal entry analysis provides relevant feedback
✅ OKR update detection works for explicit progress mentions

## Next Steps

After verifying Phase 5 works:

1. Add your real ANTHROPIC_API_KEY to `backend/.env`
2. Create meaningful OKRs for your actual goals
3. Start journaling daily
4. Watch Claude provide personalized insights!

**Ready for Phase 6:** Dashboard & Analytics with charts and visualizations
