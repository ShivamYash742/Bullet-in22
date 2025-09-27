# Standardized Mentor Marking Schema

## Overview
All mentors in the MockMentor system use the **exact same marking schema** to ensure fair, consistent, and unbiased evaluation of candidates regardless of which mentor conducts the interview.

## ✅ Consistency Guarantee
- **Same Criteria**: All mentors evaluate using identical criteria
- **Same Weights**: Each category has the same importance across all mentors  
- **Same Scoring**: Scoring algorithms are uniform for all mentors
- **Same Standards**: Passing scores and ranges are consistent

## 📊 Marking Schema Breakdown

### 1. Communication Skills (25% weight)
**Score Range**: 0-100 | **Passing Score**: 60

**Evaluation Criteria**:
- Clarity of expression
- Professional language use
- Minimal filler words (um, uh, like, etc.)
- Appropriate pace and tone

**How It's Scored**:
- 85+ points: < 5 filler words, clear articulation
- 65+ points: Understandable communication
- Below 65: Needs improvement in clarity

### 2. Technical Knowledge (30% weight)
**Score Range**: 0-100 | **Passing Score**: 65

**Evaluation Criteria**:
- Relevant technical expertise
- Industry knowledge demonstration
- Problem-solving approach
- Use of appropriate terminology

**How It's Scored**:
- Based on relevance to job role
- Confidence in technical responses
- Depth of knowledge shown

### 3. Problem Solving (25% weight)
**Score Range**: 0-100 | **Passing Score**: 60

**Evaluation Criteria**:
- Logical thinking process
- Creative solutions
- Response timing (< 3 seconds = higher score)
- Structured approach to problems

**How It's Scored**:
- 80+ points: Quick thinking (< 3s response time)
- 70+ points: Thoughtful responses
- Lower: Needs improvement in structure

### 4. Confidence (20% weight)
**Score Range**: 0-100 | **Passing Score**: 60

**Evaluation Criteria**:
- Self-assurance in responses
- Minimal hesitation
- Professional demeanor
- Stress management

**How It's Scored**:
- Based on speech patterns and confidence metrics
- Calculated from filler words and pause analysis
- Range: 60-90% typically

## 🧮 Score Calculation

### Final Score Formula
```
Final Score = (Communication × 0.25) + (Technical × 0.30) + (Problem Solving × 0.25) + (Confidence × 0.20)
```

### Score Interpretation
- **80-100**: Excellent performance
- **70-79**: Good performance  
- **60-69**: Developing performance
- **Below 60**: Needs significant improvement

## 👥 Mentor Profiles

All mentors use the same schema but have different personalities and specialties:

### Elenora - IT & Software Development
- **Personality**: Professional and detail-oriented
- **Specialty**: Technical interviews and software engineering
- **Marking**: Uses standard schema with technical focus

### Judy - Education & Training  
- **Personality**: Encouraging and thorough
- **Specialty**: Educational roles and training positions
- **Marking**: Uses standard schema with supportive approach

### June - Human Resources
- **Personality**: Empathetic and insightful
- **Specialty**: HR interviews and people management
- **Marking**: Uses standard schema with people-focused lens

### Silas - HR & Management
- **Personality**: Strategic and analytical  
- **Specialty**: Leadership and management positions
- **Marking**: Uses standard schema with leadership assessment

### Bryan - IT & Technical Leadership
- **Personality**: Direct and technically focused
- **Specialty**: Technical leadership and senior developer roles
- **Marking**: Uses standard schema with leadership + technical focus

### Wayne - General Business & Operations
- **Personality**: Balanced and comprehensive
- **Specialty**: Various business roles
- **Marking**: Uses standard schema with broad business perspective

## 🔍 Validation & Quality Assurance

### Automated Checks
- Schema consistency validation
- Weight sum verification (must equal 100%)
- Duplicate ID prevention
- Missing configuration detection

### Manual Verification
Run the validation script to ensure consistency:
```bash
node scripts/validate-mentor-consistency.js
```

## 📈 Scoring Examples

### High Performer (Score: 85)
- Communication: 90 (clear, professional, no fillers)
- Technical: 85 (strong knowledge, good terminology)
- Problem Solving: 80 (quick thinking, structured)
- Confidence: 85 (very confident, minimal hesitation)

### Average Performer (Score: 72)
- Communication: 75 (mostly clear, few fillers)
- Technical: 70 (adequate knowledge)
- Problem Solving: 70 (thoughtful but slower)
- Confidence: 75 (moderate confidence)

### Developing Performer (Score: 58)
- Communication: 60 (understandable but many fillers)
- Technical: 55 (limited knowledge shown)
- Problem Solving: 60 (basic approach)
- Confidence: 55 (hesitant, low confidence)

## 🎯 Benefits of Standardization

1. **Fairness**: No mentor bias in scoring
2. **Consistency**: Same standards regardless of mentor choice
3. **Reliability**: Repeatable and predictable evaluations
4. **Transparency**: Clear criteria and weights
5. **Improvement**: Specific areas for development identified

## 🔧 Technical Implementation

### Code Structure
```typescript
// All mentors reference the same schema
export const STANDARD_MARKING_SCHEMA = {
  communicationSkills: { weight: 0.25, criteria: [...], passingScore: 60 },
  technicalKnowledge: { weight: 0.30, criteria: [...], passingScore: 65 },
  problemSolving: { weight: 0.25, criteria: [...], passingScore: 60 },
  confidence: { weight: 0.20, criteria: [...], passingScore: 60 }
};

// Each mentor uses the same schema
const mentor = {
  id: 'mentor_id',
  name: 'Mentor Name',
  markingSchema: STANDARD_MARKING_SCHEMA  // Same for all
};
```

### Validation Function
```typescript
export const validateMarkingConsistency = () => {
  const schemas = mentors.map(mentor => mentor.markingSchema);
  return schemas.every(schema => 
    JSON.stringify(schema) === JSON.stringify(STANDARD_MARKING_SCHEMA)
  );
};
```

## 🚀 Future Enhancements

While maintaining consistency, future improvements could include:
- Industry-specific weight adjustments (while keeping core criteria)
- Advanced AI analysis integration
- Real-time scoring feedback
- Comparative benchmarking

**Note**: Any changes to the marking schema will be applied to ALL mentors simultaneously to maintain fairness and consistency.
