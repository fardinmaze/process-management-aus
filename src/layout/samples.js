// Hard-coded sample processes for the layout spike. Shape follows MVP_SPEC section 5.
const A = (id, label, role, section, extra = {}) => ({ id, kind: 'activity', label, role, section, tasks: [], notes: '', system: '', ...extra })
const D = (id, label, role, section, yes, no) => ({ id, kind: 'decision', label, role, section, yes, no })

export const SAMPLES = {
  simple: {
    title: '1. Straight line, three roles',
    items: [
      A('a1', 'Receive request', 'HR Officer', 'HR admin'),
      A('a2', 'Approve request', 'Line Manager', 'Line manager tasks'),
      A('a3', 'Create account', 'IT Support', 'IT setup'),
      A('a4', 'Confirm to employee', 'HR Officer', 'HR admin'),
    ],
  },
  onboarding: {
    title: '2. Onboarding: decisions, side branch, cross-section jump',
    items: [
      A('a1', 'Create employee record', 'HR Officer', 'HR admin', { system: 'HRIS', tasks: ['Enter start date', 'Enter salary band'] }),
      A('a2', 'Run background check', 'HR Officer', 'HR admin'),
      D('d1', 'Background check clear?', 'HR Officer', 'HR admin', null, 'a9'),
      A('a3', 'Order laptop', 'IT Support', 'IT setup', { system: 'Service Desk' }),
      A('a4', 'Create accounts and email', 'IT Support', 'IT setup', { system: 'Service Desk' }),
      A('a5', 'Set up payroll', 'Payroll', 'HR admin', { system: 'HRIS' }),
      A('a6', 'Schedule day-1 induction', 'Line Manager', 'Line manager tasks'),
      D('d2', 'Manager on leave on day 1?', 'Line Manager', 'Line manager tasks', 'a7', 'a8'),
      A('a7', 'Assign cover buddy', 'Line Manager', 'Line manager tasks', { next: 'a10' }),
      A('a8', 'Welcome employee', 'Line Manager', 'Line manager tasks'),
      A('a10', 'Day-30 review', 'Line Manager', 'Line manager tasks', { next: 'END' }),
      A('a9', 'Withdraw the offer', 'HR Officer', 'HR admin', { next: 'END' }),
    ],
  },
  loop: {
    title: '3. Loop: rework goes back to an earlier step',
    items: [
      A('a1', 'Lodge application', 'Applicant Services', 'Intake'),
      A('a2', 'Check documents', 'Planning Officer', 'Assessment'),
      D('d1', 'Documents complete?', 'Planning Officer', 'Assessment', null, 'a3'),
      A('a4', 'Assess against code', 'Planning Officer', 'Assessment'),
      D('d2', 'Compliant?', 'Planning Officer', 'Assessment', 'a5', 'a6'),
      A('a5', 'Issue approval', 'Manager', 'Decision', { next: 'END' }),
      A('a6', 'Request changes', 'Applicant Services', 'Intake', { next: 'a2' }),
      A('a3', 'Request missing documents', 'Applicant Services', 'Intake', { next: 'a2' }),
    ],
  },
}
