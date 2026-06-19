// data.js
// This file is the single source of truth for Kevin's profile, cover letter
// template, and saved application answers. To update anything (new job,
// new phone number, new saved answer), edit this file directly and reload
// the extension in chrome://extensions.

const JOBFILL_PROFILE = {
  personal: {
    fullName: "Kevin Barcelo",
    preferredInitials: "KB",
    location: "Chapel Hill, NC",
    phone: "720-619-1337",
    email: "kevinobarcelo@outlook.com",
    linkedin: "https://www.linkedin.com/in/kevinbarcelo",
    workAuthorization: "U.S. citizen, authorized to work in the United States",
    sponsorshipRequired: "No",
    earliestStartDate: "Immediately",
    willingToRelocate: "Yes",
    preferredWorkType: "Full-time preferred; part-time acceptable if full-time is not available"
  },

  // Only included because Kevin explicitly provided these for his own use.
  demographics: {
    gender: "Male",
    pronouns: "He/Him",
    hispanicLatino: "Yes",
    raceEthnicity: "Latino / Hispanic / White",
    veteranStatus: "Not a veteran / No",
    disabilityStatus: "No / Not disabled / N/A",
    driversLicense: "Yes",
    backgroundCheck: "Yes",
    drugScreening: "Yes",
    signatureInitials: "KB",
    signatureName: "Kevin Barcelo"
    // Signature date is generated at fill-time, not stored here.
    // SSN / Social Security is intentionally NOT stored anywhere. Never autofill.
  },

  summary: "Psychology graduate with a background in foreign languages and experience spanning behavioral health, administrative operations, nonprofit, educational, and corporate environments. Skilled in documentation, records management, data entry, research methods, staff training, instruction, client communication, and cross-departmental coordination. Experienced using CRM and LMS platforms to support administrative operations, maintain accurate records, and manage information across multiple systems. Proven ability to work effectively with clients, students, and individuals of diverse backgrounds while maintaining adaptability, accuracy, organization, and attention to detail across multiple responsibilities and environments.",

  experience: [
    {
      employer: "National Safety Council",
      title: "Customer Service Representative",
      location: "Remote",
      dates: "Nov. 2025 – Apr. 2026",
      bullets: [
        "Managed an average of 40+ inbound calls daily while supporting driver education and safety training programs.",
        "Registered participants for educational programs, processed payments, and provided LMS support including account access, certificate retrieval, and course navigation assistance.",
        "Resolved escalated concerns with professionalism and empathy while maintaining accurate records across multiple business systems."
      ]
    },
    {
      employer: "Parker Davis HVAC International, Inc.",
      title: "Technical Support Representative",
      location: "Miami, FL",
      dates: "Sep. 2021 – Jan. 2025",
      bullets: [
        "Assisted an average of 50+ contractors, technicians, and DIY customers daily via phone, email, and live chat with HVAC load calculations, system sizing, equipment selection, installation guidance, and technical troubleshooting.",
        "Trained and mentored new employees on product applications, installation procedures, refrigerant and electrical testing, and customer consultation.",
        "Updated manuals, schematics, blueprints, diagrams, and technical documentation to reflect manufacturing changes and simplify installation, operation, and diagnostics.",
        "Collaborated with the sales department to assess project requirements and recommend appropriate equipment configurations and system layouts.",
        "Represented the company at the AHR Expo trade show, showcasing products and discussing equipment applications with manufacturers, distributors, contractors, and industry partners."
      ]
    },
    {
      employer: "Brain Power Inc.",
      title: "Customer Service Representative",
      location: "Miami, FL",
      dates: "Sep. 2020 – Sep. 2021",
      bullets: [
        "Prepared quotes and invoices for optical laboratories, suppliers, and major retail customers.",
        "Provided technical guidance on lens-tinting products, equipment operation, and troubleshooting."
      ]
    }
  ],

  education: [
    {
      school: "Florida International University",
      degree: "Bachelor of Arts in Psychology",
      year: "2026",
      note: "Concentration: Applied Behavior Analysis"
    },
    {
      school: "Miami Dade College",
      degree: "Associate of Arts in Foreign Languages",
      year: "2024",
      note: "Honor: Phi Theta Kappa Honor Society"
    }
  ],

  certifications: [
    "Microsoft Office Specialist: Word, Excel, Outlook, PowerPoint",
    "Adobe Certified Associate: Photoshop, Dreamweaver, Illustrator",
    "Adult & Pediatric First Aid/CPR/AED"
  ],

  languages: ["English", "Spanish", "Italian", "Portuguese", "French"],

  skills: [
    "Administrative Support",
    "Records Administration",
    "Document Management",
    "Data Entry",
    "Invoice Processing",
    "Call Center Operations",
    "Bilingual Interpretation and Translation: English-Spanish",
    "Technical Documentation",
    "Research Methods",
    "Behavioral Observation and Analysis",
    "Instruction",
    "Onboarding",
    "CRM platforms",
    "LMS platforms",
    "Customer communication",
    "Cross-departmental coordination",
    "Staff training"
  ],

  references: [
    {
      name: "Saima Arina",
      title: "Former RBT Trainer",
      company: "N/A",
      phone: "786-626-1771",
      email: "saimaarina0430@gmail.com",
      relationship: "Former Trainer",
      yearsKnown: "5",
      mayContact: "Yes"
    },
    {
      name: "Laura Torres",
      title: "Customer Service Supervisor",
      company: "Parker-Davis HVAC International",
      phone: "786-613-0195",
      email: "lauratorresarig@gmail.com",
      relationship: "Former Supervisor",
      yearsKnown: "5",
      mayContact: "Yes"
    },
    {
      name: "Christine Turnbull",
      title: "Mentor",
      company: "Wake Forest University",
      phone: "770-846-2821",
      email: "turncr21@wfu.edu",
      relationship: "Professional Mentor",
      yearsKnown: "2",
      mayContact: "Yes"
    }
  ],

  targetRoles: [
    "Academic Advisor Assistant",
    "Admissions Counselor",
    "Research Assistant",
    "Clinical Research Coordinator Assistant",
    "Patient Services Representative",
    "Behavior Technician",
    "Mental Health Technician",
    "Case Management Assistant",
    "Program Coordinator",
    "Administrative Assistant",
    "Executive Assistant",
    "Operations Coordinator",
    "Scheduling Coordinator",
    "Customer Success / Customer Support roles aligned with education, healthcare, research, or public service"
  ]
};

// Use {{DATE}}, {{JOB_ROLE}}, and {{EMPLOYER_NAME}} as fill-in placeholders.
const JOBFILL_COVER_LETTER_TEMPLATE = `Kevin Barcelo
Chapel Hill, NC
kevinobarcelo@outlook.com
720-619-1337

{{DATE}}

{{EMPLOYER_NAME}}

Dear Hiring Manager,

I am writing to express my interest in the {{JOB_ROLE}} at {{EMPLOYER_NAME}}. As a recent Psychology graduate with more than five years of experience in documentation, records management, customer communication, and operational support, I am excited by the opportunity to contribute to public health research with meaningful real-world impact.

Throughout my career, I have developed strong organizational, communication, and problem-solving skills while working in fast-paced environments that required accuracy, attention to detail, and effective interaction with diverse populations. In my previous roles, I maintained detailed records, documented interactions, managed information across multiple systems, and helped individuals navigate complex processes while ensuring professionalism and confidentiality.

My Psychology education provided exposure to research methods, data collection, ethics, and human behavior. In addition, RBT-related training strengthened my understanding of behavioral observation, participant-centered communication, and adherence to established protocols. These experiences sparked my interest in research and the role evidence-based interventions can play in improving public health outcomes.

I am particularly excited about the opportunity to support participant recruitment, screening, scheduling, data collection, and study implementation within the organization. The interdisciplinary and collaborative nature of the work strongly aligns with my interests and professional goals, and I would welcome the opportunity to contribute to work that informs policies, services, programs, or research designed to improve health and well-being.

Thank you for your time and consideration. I look forward to discussing how my skills, adaptability, and enthusiasm for research can contribute to your team.

Kevin Barcelo`;

// Each entry is matched against application questions later (Phase 5).
const JOBFILL_QUESTION_BANK = [
  {
    question: "Why do you want to work here?",
    answer: "I am interested in this role because it aligns with my background in psychology, documentation, customer communication, and operational support. I am drawn to opportunities where I can help people, maintain accurate records, support organized processes, and contribute to meaningful work. I bring experience from nonprofit, corporate, educational, and healthcare-related environments, and I am excited by the chance to apply those skills in a role where accuracy, communication, adaptability, and professionalism matter."
  },
  {
    question: "Tell us about yourself.",
    answer: "I am a recent Psychology graduate with experience in customer service, technical support, documentation, records management, training, and administrative operations. My background includes work with the National Safety Council, Parker Davis HVAC International, and Brain Power Inc., where I supported clients, maintained accurate records, solved problems, and communicated across different teams. I am bilingual in English and Spanish, with additional language skills in Italian, Portuguese, and French. I am organized, adaptable, detail-oriented, and motivated to build a career in a people-centered role where I can contribute to strong service, research, education, healthcare, or program operations."
  },
  {
    question: "Why are you qualified for this position?",
    answer: "I am qualified for this position because I bring a strong combination of education, communication skills, documentation experience, and operational support experience. My Psychology background gave me exposure to human behavior, research methods, ethics, and behavioral observation, while my professional roles strengthened my ability to manage records, support clients, resolve issues, process information accurately, and work across multiple systems. I have experience handling high-volume communication, maintaining professionalism with diverse populations, training others, and adapting quickly in fast-paced environments. These skills make me prepared to contribute effectively and learn quickly in this role."
  },
  {
    question: "Describe a challenge you overcame.",
    answer: "One of the biggest challenges I overcame was moving to Mexico on my own while continuing my education and supporting myself through tutoring. Adapting to a new environment required me to become more independent, organized, and resilient. At the same time, I was pursuing psychology coursework while tutoring students in English, which required balancing academic responsibilities with lesson planning and student support. Managing those commitments taught me how to prioritize effectively, adapt to unfamiliar situations, and remain focused on long-term goals even when circumstances were challenging. The experience strengthened my confidence, communication skills, and ability to work successfully across different cultures and environments."
  },
  {
    question: "Describe a time you worked on a team.",
    answer: "While working in technical support, our team faced frequent call volume spikes that created long wait times and inconsistent customer experiences. I worked with coworkers and management to improve how calls were routed through the phone system. One suggestion I helped implement was reorganizing queue numbering so the technical support queue had a larger buffer before overflow occurred, which reduced disruptions and improved call handling during peak periods. I also helped develop updated call greetings that reminded customers to have their model numbers available before speaking with an agent. This simple change reduced call times and allowed technicians to assist customers more efficiently. The experience showed me the value of collaboration, process improvement, and working with a team to solve operational challenges."
  },
  {
    question: "Describe a time you dealt with a difficult customer.",
    answer: "While working in HVAC technical support, I assisted a customer who was attempting to install a mini-split system and became extremely frustrated after multiple installation issues prevented the system from operating correctly. The customer was upset and convinced the equipment was defective. Rather than reacting to the frustration, I remained calm and focused on understanding the problem. I asked the customer to send photos of the installation so I could better evaluate the setup and identify where things may have gone wrong. After reviewing the images, I noticed several wiring and configuration issues that differed from the installation instructions. I carefully walked the customer through the corrections step by step, reassuring them throughout the process and explaining why each adjustment was necessary. Once the corrections were made, the system operated properly. By staying patient, listening carefully, and using photos to improve communication, I was able to resolve the issue and turn a negative experience into a positive outcome."
  },
  {
    question: "What are your strengths?",
    answer: "My greatest strengths are patience and adaptability. I remain calm and professional when working through complex problems, assisting frustrated individuals, or learning new systems and procedures. Patience allows me to listen carefully, understand concerns, and provide thoughtful solutions, while adaptability helps me adjust quickly to changing priorities, new environments, and unfamiliar challenges. Together, these strengths have allowed me to succeed in customer service, technical support, education, and administrative roles while maintaining a positive and solution-oriented approach."
  },
  {
    question: "What is your greatest weakness?",
    answer: "One weakness I have worked on is being overly detail-oriented. I take pride in producing accurate, high-quality work, but earlier in my career I sometimes spent too much time perfecting details that had already met expectations. Over time, I learned to balance quality with efficiency by focusing on the level of detail appropriate for the task, setting clear priorities, and recognizing when a project is ready to move forward. This has helped me maintain high standards while working more effectively in fast-paced environments."
  },
  {
    question: "Why are you leaving your current or previous position?",
    answer: "Many of my career transitions have been driven by relocation, educational goals, and opportunities for professional growth. As I progressed through my Psychology degree, I became increasingly interested in roles that align more closely with my academic background and long-term career objectives. While I value the experience I gained in customer service, technical support, and administrative positions, I am now seeking opportunities where I can apply those transferable skills in areas related to research, healthcare, education, behavioral health, program operations, or other people-centered fields that better match my education and future goals."
  },
  {
    question: "Describe your customer service experience.",
    answer: "I have several years of customer service experience across nonprofit, technical, optical, and administrative environments. At the National Safety Council, I handled high-volume inbound calls, helped participants register for programs, processed payments, supported LMS access, and resolved concerns with professionalism and empathy. At Parker Davis HVAC International, I assisted contractors, technicians, and DIY customers with equipment selection, installation guidance, troubleshooting, and documentation. These roles strengthened my ability to communicate clearly, remain calm under pressure, document interactions accurately, and support people with different levels of technical knowledge."
  },
  {
    question: "Describe your administrative experience.",
    answer: "My administrative experience includes records management, data entry, document management, invoice processing, customer communication, LMS support, CRM usage, and cross-departmental coordination. I have maintained accurate records across multiple systems, prepared quotes and invoices, documented customer interactions, supported registration and payment processes, and helped manage information in fast-paced environments. I am comfortable balancing accuracy, organization, confidentiality, and clear communication while supporting daily operations."
  },
  {
    question: "Describe your research experience.",
    answer: "My research-related background comes primarily from my Psychology education, where I studied research methods, data collection, ethics, behavioral observation, and human behavior. My professional experience also supports research-oriented work because I have maintained detailed records, documented interactions, followed established procedures, managed information across systems, and communicated with diverse populations. I am especially interested in roles where I can support participant recruitment, screening, scheduling, data collection, and study implementation while continuing to build hands-on research experience."
  },
  {
    question: "Describe your experience working with diverse populations.",
    answer: "I have worked with diverse populations across customer service, education, tutoring, technical support, and administrative settings. As a bilingual English-Spanish speaker with additional language study in Italian, Portuguese, and French, I value clear communication and cultural awareness. I have supported customers, students, contractors, healthcare-related professionals, and program participants with different backgrounds, needs, and levels of familiarity with systems or technical information. These experiences taught me to remain patient, respectful, and adaptable while helping people feel understood and supported."
  },
  {
    question: "Why should we hire you?",
    answer: "You should hire me because I bring a strong mix of education, professional experience, adaptability, and people-centered communication. My background in psychology, customer service, technical support, documentation, training, and administrative operations allows me to support both people and processes effectively. I learn quickly, communicate clearly, stay calm under pressure, and take accuracy seriously. I am motivated to contribute to a team where organization, professionalism, and service matter, and I am ready to apply my transferable skills to this role."
  },
  {
    question: "What are your long-term career goals?",
    answer: "My long-term goal is to build a career that combines psychology, education, research, healthcare, or public service with meaningful support for individuals and communities. I am especially interested in roles that allow me to develop professionally while contributing to programs, research, or services that improve outcomes for people. Over time, I hope to continue expanding my skills in research, behavioral health, program operations, and people-centered support while pursuing opportunities aligned with my academic background and commitment to lifelong learning."
  },
  {
    question: "Describe a time you learned something quickly.",
    answer: "In technical support, I often had to learn new product information, installation procedures, system updates, or troubleshooting steps quickly so I could assist customers accurately. When manuals, schematics, or product specifications changed, I reviewed the updates, asked clarifying questions, and applied the new information directly in customer interactions. This helped me become comfortable learning complex information under pressure and translating it into clear guidance for others. That experience strengthened my ability to adapt quickly and stay effective in changing environments."
  },
  {
    question: "Describe a time you handled confidential information.",
    answer: "In customer service and administrative roles, I regularly handled sensitive customer and participant information, including contact details, payment-related information, program records, and account access issues. I understood the importance of protecting that information, following established procedures, and documenting interactions accurately without sharing unnecessary details. These experiences reinforced the importance of confidentiality, professionalism, and trust when working with personal or organizational records."
  },
  {
    question: "Describe a time you improved a process.",
    answer: "While working in technical support, I helped improve the customer call flow by supporting changes to phone queue routing and customer greetings. Our team experienced high call volume, and customers often reached agents without having key information ready. I helped develop improved greetings that reminded customers to have their model numbers available, which made calls more efficient and reduced time spent searching for basic product details. I also supported better queue organization so technical support had a stronger buffer during busy periods. These changes helped the team serve customers more smoothly and showed me how small process improvements can make a meaningful operational difference."
  },
  {
    question: "Describe a time you managed competing priorities.",
    answer: "I have often managed competing priorities in fast-paced customer service and technical support roles. For example, at the National Safety Council and Parker Davis HVAC International, I balanced incoming calls, documentation, follow-up tasks, customer concerns, and coordination with other teams. I learned to prioritize urgent issues, keep accurate records, and stay organized while continuing to provide professional support. These experiences helped me become more efficient, adaptable, and comfortable managing multiple responsibilities at once."
  }
];
