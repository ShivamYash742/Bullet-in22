/**
 * Validation script to ensure all mentors use the same marking schema
 * This ensures fair and consistent evaluation across all mentors
 */

const { mentors, STANDARD_MARKING_SCHEMA, validateMarkingConsistency } = require('../components/mentors.tsx');

function validateMentorConfiguration() {
  console.log('🔍 Validating Mentor Configuration...\n');
  
  // Check if all mentors exist
  console.log(`📊 Total Mentors: ${mentors.length}`);
  
  // List all mentors
  console.log('\n👥 Available Mentors:');
  mentors.forEach((mentor, index) => {
    console.log(`${index + 1}. ${mentor.name} (${mentor.id})`);
    console.log(`   Specialty: ${mentor.specialty}`);
    console.log(`   Personality: ${mentor.personality}`);
    console.log(`   Description: ${mentor.description}\n`);
  });
  
  // Validate marking schema consistency
  console.log('⚖️  Validating Marking Schema Consistency...');
  
  const isConsistent = validateMarkingConsistency();
  
  if (isConsistent) {
    console.log('✅ SUCCESS: All mentors use the same marking schema!');
  } else {
    console.log('❌ ERROR: Mentors have different marking schemas!');
    return false;
  }
  
  // Validate schema structure
  console.log('\n📋 Standard Marking Schema:');
  Object.entries(STANDARD_MARKING_SCHEMA).forEach(([category, config]) => {
    console.log(`\n${category.toUpperCase()}:`);
    console.log(`  Weight: ${(config.weight * 100)}%`);
    console.log(`  Passing Score: ${config.passingScore}/100`);
    console.log(`  Score Range: ${config.scoreRange.min}-${config.scoreRange.max}`);
    console.log(`  Criteria: ${config.criteria.join(', ')}`);
  });
  
  // Validate weights sum to 100%
  const totalWeight = Object.values(STANDARD_MARKING_SCHEMA)
    .reduce((sum, config) => sum + config.weight, 0);
  
  console.log(`\n🧮 Total Weight Validation:`);
  if (Math.abs(totalWeight - 1.0) < 0.001) {
    console.log(`✅ Weights sum correctly: ${(totalWeight * 100)}%`);
  } else {
    console.log(`❌ ERROR: Weights don't sum to 100%: ${(totalWeight * 100)}%`);
    return false;
  }
  
  // Check for duplicate mentor IDs
  const mentorIds = mentors.map(m => m.id);
  const uniqueIds = [...new Set(mentorIds)];
  
  if (mentorIds.length === uniqueIds.length) {
    console.log('✅ All mentor IDs are unique');
  } else {
    console.log('❌ ERROR: Duplicate mentor IDs found!');
    const duplicates = mentorIds.filter((id, index) => mentorIds.indexOf(id) !== index);
    console.log('Duplicates:', duplicates);
    return false;
  }
  
  // Check for missing images
  console.log('\n🖼️  Image Path Validation:');
  mentors.forEach(mentor => {
    if (mentor.image && mentor.image.trim()) {
      console.log(`✅ ${mentor.name}: ${mentor.image}`);
    } else {
      console.log(`❌ ${mentor.name}: Missing image path`);
    }
  });
  
  console.log('\n🎯 Scoring Consistency Check:');
  console.log('All mentors will evaluate candidates using:');
  console.log('- Communication Skills (25%): Clarity, professional language, minimal fillers');
  console.log('- Technical Knowledge (30%): Expertise, industry knowledge, terminology');
  console.log('- Problem Solving (25%): Logic, creativity, response timing, structure');
  console.log('- Confidence (20%): Self-assurance, minimal hesitation, stress management');
  
  console.log('\n✅ VALIDATION COMPLETE: All mentors are configured consistently!');
  console.log('🎉 Fair and standardized evaluation is ensured across all mentors.');
  
  return true;
}

// Export for testing
function getMentorStats() {
  return {
    totalMentors: mentors.length,
    specialties: [...new Set(mentors.map(m => m.specialty))],
    personalities: [...new Set(mentors.map(m => m.personality))],
    isConsistent: validateMarkingConsistency(),
    weightSum: Object.values(STANDARD_MARKING_SCHEMA).reduce((sum, config) => sum + config.weight, 0)
  };
}

// Run validation if script is executed directly
if (require.main === module) {
  try {
    const isValid = validateMentorConfiguration();
    process.exit(isValid ? 0 : 1);
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

module.exports = {
  validateMentorConfiguration,
  getMentorStats
};
