import Layout from '@/components/Layout';
import SignedContractsReportPanel from '@/components/SignedContractsReportPanel';

export default function SignedContracts() {
  return (
    <Layout>
      <div className="space-y-6">
        <SignedContractsReportPanel />
      </div>
    </Layout>
  );
}
