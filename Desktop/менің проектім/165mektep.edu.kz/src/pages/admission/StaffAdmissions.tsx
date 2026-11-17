import AdmissionsPage from './AdmissionsPage';
import { useSeo } from '../../lib/seo';

export default function StaffAdmissions() {
  useSeo('Қабылдау өтініштері', undefined, '/staff/admissions');
  return (
    <section className="page">
      <div className="container stack-lg">
        <AdmissionsPage />
      </div>
    </section>
  );
}
