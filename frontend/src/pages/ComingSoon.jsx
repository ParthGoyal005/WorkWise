import AppLayout from '../layouts/AppLayout';
import EmptyState from '../components/common/EmptyState';

export default function ComingSoon({ title, description }) {
  return (
    <AppLayout>
      <section className="page-header">
        <div>
          <p className="eyebrow">Coming next</p>
          <h2>{title}</h2>
        </div>
      </section>
      <EmptyState
        title={`${title} module is next`}
        description={
          description ||
          'This screen is wired into navigation. Implementation lands in the next incremental module.'
        }
      />
    </AppLayout>
  );
}
