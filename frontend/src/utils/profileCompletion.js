/**
 * Utility to calculate profile completion percentage and missing areas
 */
export function calculateProfileCompletion(profile) {
  if (!profile) {
    return {
      percentage: 0,
      completedCount: 0,
      totalCount: 6,
      missingItems: [
        { id: 'personal', label: 'Personal & Contact Details' },
        { id: 'work_auth', label: 'Work Authorization & CTC' },
        { id: 'experience', label: 'Work Experience or Fresher Status' },
        { id: 'education', label: 'Education History' },
        { id: 'skills', label: 'Key Skills' },
        { id: 'portfolios', label: 'Links & Socials' }
      ]
    };
  }

  const checks = [
    {
      id: 'personal',
      label: 'Personal & Contact Details',
      isComplete: Boolean(
        (profile.first_name || profile.full_name)?.trim() &&
        profile.phone?.trim() &&
        profile.city?.trim()
      )
    },
    {
      id: 'work_auth',
      label: 'Work Authorization & CTC',
      isComplete: Boolean(
        profile.work_authorization?.visa_status &&
        (profile.work_authorization?.expected_ctc?.trim() || profile.work_authorization?.current_ctc?.trim())
      )
    },
    {
      id: 'experience',
      label: 'Work Experience / Fresher',
      isComplete: Boolean(
        profile.is_fresher ||
        (profile.experience && profile.experience.length > 0 && profile.experience[0]?.company?.trim())
      )
    },
    {
      id: 'education',
      label: 'Education History',
      isComplete: Boolean(
        profile.education &&
        profile.education.length > 0 &&
        profile.education[0]?.institution?.trim()
      )
    },
    {
      id: 'skills',
      label: 'Key Skills',
      isComplete: Boolean(profile.skills && profile.skills.length >= 2)
    },
    {
      id: 'portfolios',
      label: 'Links & Portfolios',
      isComplete: Boolean(
        profile.linkedin_url?.trim() ||
        profile.github_url?.trim() ||
        profile.portfolio_url?.trim()
      )
    }
  ];

  const completed = checks.filter((c) => c.isComplete);
  const percentage = Math.round((completed.length / checks.length) * 100);
  const missingItems = checks.filter((c) => !c.isComplete);

  return {
    percentage,
    completedCount: completed.length,
    totalCount: checks.length,
    missingItems
  };
}

