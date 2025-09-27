import { cn } from '@/lib/utils';
import { Marquee } from '@/components/magicui/marquee';
import SectionHeading from './section-heading';

// Standardized marking schema used by all mentors
export const STANDARD_MARKING_SCHEMA = {
  communicationSkills: {
    weight: 0.25, // 25% of total score
    criteria: [
      'Clarity of expression',
      'Professional language use', 
      'Minimal filler words',
      'Appropriate pace and tone'
    ],
    scoreRange: { min: 0, max: 100 },
    passingScore: 60
  },
  technicalKnowledge: {
    weight: 0.30, // 30% of total score
    criteria: [
      'Relevant technical expertise',
      'Industry knowledge',
      'Problem-solving approach',
      'Use of appropriate terminology'
    ],
    scoreRange: { min: 0, max: 100 },
    passingScore: 65
  },
  problemSolving: {
    weight: 0.25, // 25% of total score
    criteria: [
      'Logical thinking process',
      'Creative solutions',
      'Response timing',
      'Structured approach'
    ],
    scoreRange: { min: 0, max: 100 },
    passingScore: 60
  },
  confidence: {
    weight: 0.20, // 20% of total score
    criteria: [
      'Self-assurance in responses',
      'Minimal hesitation',
      'Professional demeanor',
      'Stress management'
    ],
    scoreRange: { min: 0, max: 100 },
    passingScore: 60
  }
};

// Mentor configuration with consistent marking schema
export const mentors = [
  {
    id: 'June_HR_public',
    image: '/mentors/June_HR_public.webp',
    name: 'June',
    specialty: 'Human Resources',
    description: 'Expert in HR interviews and people management roles',
    markingSchema: STANDARD_MARKING_SCHEMA,
    personality: 'Empathetic and insightful',
    available: true,
    comingSoon: false
  },
  {
    id: 'Elenora_IT_Sitting_public',
    image: '/mentors/Elenora_IT_Sitting_public.webp',
    name: 'Elenora',
    specialty: 'IT & Software Development',
    description: 'Expert in technical interviews and software engineering roles',
    markingSchema: STANDARD_MARKING_SCHEMA, // All mentors use same schema
    personality: 'Professional and detail-oriented',
    available: false,
    comingSoon: true
  },
  {
    id: 'Judy_Teacher_Sitting_public',
    image: '/mentors/Judy_Teacher_Sitting_public.webp',
    name: 'Judy',
    specialty: 'Education & Training',
    description: 'Specialized in educational roles and training positions',
    markingSchema: STANDARD_MARKING_SCHEMA,
    personality: 'Encouraging and thorough',
    available: false,
    comingSoon: true
  },
  {
    id: 'SilasHR_public',
    image: '/mentors/SilasHR_public.webp',
    name: 'Silas',
    specialty: 'Human Resources & Management',
    description: 'Focused on leadership and management position interviews',
    markingSchema: STANDARD_MARKING_SCHEMA,
    personality: 'Strategic and analytical',
    available: false,
    comingSoon: true
  },
  {
    id: 'Bryan_IT_Sitting_public', // Fixed spacing issue
    image: '/mentors/Bryan_IT_Sitting_public.webp', // Fixed spacing issue
    name: 'Bryan',
    specialty: 'IT & Technical Leadership',
    description: 'Expert in technical leadership and senior developer roles',
    markingSchema: STANDARD_MARKING_SCHEMA,
    personality: 'Direct and technically focused',
    available: false,
    comingSoon: true
  },
  {
    id: 'Wayne_20240711',
    image: '/mentors/Wayne_20240711.webp',
    name: 'Wayne',
    specialty: 'General Business & Operations',
    description: 'Versatile interviewer for various business roles',
    markingSchema: STANDARD_MARKING_SCHEMA,
    personality: 'Balanced and comprehensive',
    available: false,
    comingSoon: true
  },
];

// Helper function to get mentor by ID
export const getMentorById = (id: string) => {
  return mentors.find(mentor => mentor.id === id || mentor.id.trim() === id.trim());
};

// Helper function to get only available mentors
export const getAvailableMentors = () => {
  return mentors.filter(mentor => mentor.available);
};

// Helper function to validate marking consistency
export const validateMarkingConsistency = () => {
  const schemas = mentors.map(mentor => mentor.markingSchema);
  const firstSchema = schemas[0];
  
  return schemas.every(schema => 
    JSON.stringify(schema) === JSON.stringify(firstSchema)
  );
};

// Export mentor interface for TypeScript
export interface Mentor {
  id: string;
  image: string;
  name: string;
  specialty: string;
  description: string;
  markingSchema: typeof STANDARD_MARKING_SCHEMA;
  personality: string;
  available: boolean;
  comingSoon: boolean;
}

const MentorCard = ({ image, name, specialty, available, comingSoon }: { image: string; name: string; specialty?: string; available: boolean; comingSoon: boolean }) => {
  return (
    <figure
      className={cn(
        'relative h-full w-67 lg:w-100 cursor-pointer overflow-hidden rounded-xl border',
        // light styles
        'border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]',
        // dark styles
        'dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]',
        // unavailable styles
        !available && 'opacity-60'
      )}
    >
      <div className="flex flex-col items-center gap-2">
        <img width="100%" height="100%" alt={name} src={image} />
      </div>
      <div className="absolute bottom-0 left-0 right-0 text-center bg-black/50 backdrop-blur-sm p-2">
        <span className="text-sm font-medium text-white">{name}</span>
        {specialty && (
          <p className="text-xs text-gray-300 mt-1">{specialty}</p>
        )}
        {comingSoon && (
          <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
            Coming Soon
          </div>
        )}
      </div>
    </figure>
  );
};

export function Mentors() {
  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
      <SectionHeading
        title="Our Mentors"
        subtitle="AI mentors are here to help you with your interview preparation"
      />
      <Marquee pauseOnHover className="[--duration:30s]">
        {mentors.map((mentor) => (
          <MentorCard 
            key={mentor.id} 
            image={mentor.image} 
            name={mentor.name} 
            specialty={mentor.specialty}
            available={mentor.available}
            comingSoon={mentor.comingSoon}
          />
        ))}
      </Marquee>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background"></div>
    </div>
  );
}
