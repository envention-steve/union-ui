import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { DocumentCard } from '@/components/features/documents/document-card';
import { UpdateCard } from '@/components/features/updates/update-card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Download,
  Heart,
  Calendar,
  FileCheck,
  HelpCircle,
  Users,
  BarChart,
  Info,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-union-900">
      <PublicHeader />
      
      {/* Hero Section */}
      <section className="bg-union-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-union-100 mb-6">
            Union Benefit Management
          </h1>
          <p className="text-xl text-union-200 mb-8 max-w-3xl mx-auto">
            Access your benefits information, download important documents, and 
            stay updated with the latest announcements from your union.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="bg-union-600 hover:bg-union-500 text-white px-8 py-3 text-lg"
              size="lg"
            >
              <Download className="w-5 h-5 mr-2" />
              View Documents
            </Button>
            <Button 
              variant="outline"
              className="border-union-500 text-union-100 hover:bg-union-800 px-8 py-3 text-lg"
              size="lg"
            >
              <Info className="w-5 h-5 mr-2" />
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Latest Updates Section */}
      <section className="bg-union-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Latest Updates</h2>
            <p className="text-union-200">
              Important messages and announcements from your benefits manager.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <UpdateCard
              title="Open Enrollment Period Extended"
              description="The open enrollment period has been extended until December 31st. Make sure to review your benefit selections and submit any changes before the deadline."
              date="2 days ago"
              category="Important"
              categoryColor="bg-green-600"
              icon={<Calendar className="w-5 h-5 text-white" />}
            />
            
            <UpdateCard
              title="New Health Plan Options Available"
              description="We've added two new health plan options with enhanced coverage. Review the updated plan documents in the files section below."
              date="5 days ago"
              category="New"
              categoryColor="bg-blue-600"
              icon={<Heart className="w-5 h-5 text-white" />}
            />
          </div>
        </div>
      </section>

      {/* Available Documents Section */}
      <section className="bg-union-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Available Documents</h2>
            <p className="text-union-200">
              Download important benefit documents and forms.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <DocumentCard
              title="Benefits Summary"
              description="Complete overview of all available benefits including health, dental, and retirement plans."
              fileSize="PDF • 2.1 MB"
              icon={<FileText className="w-6 h-6 text-white" />}
              iconColor="bg-red-600"
            />
            
            <DocumentCard
              title="Enrollment Form"
              description="Fillable enrollment form for new members and benefit changes."
              fileSize="PDF • 1.8 MB"
              icon={<FileCheck className="w-6 h-6 text-white" />}
              iconColor="bg-green-600"
            />
            
            <DocumentCard
              title="Plan Comparison"
              description="Side-by-side comparison of all health plan options and coverage details."
              fileSize="PDF • 3.2 MB"
              icon={<BarChart className="w-6 h-6 text-white" />}
              iconColor="bg-purple-600"
            />
            
            <DocumentCard
              title="Claims Form"
              description="Standard claim form for medical and dental reimbursements."
              fileSize="PDF • 1.2 MB"
              icon={<FileText className="w-6 h-6 text-white" />}
              iconColor="bg-orange-600"
            />
            
            <DocumentCard
              title="FAQ Document"
              description="Frequently asked questions about benefits enrollment and use."
              fileSize="PDF • 0.9 MB"
              icon={<HelpCircle className="w-6 h-6 text-white" />}
              iconColor="bg-blue-600"
            />
            
            <DocumentCard
              title="Contact Directory"
              description="Contact information for all benefit providers and customer service."
              fileSize="PDF • 0.3 MB"
              icon={<Users className="w-6 h-6 text-white" />}
              iconColor="bg-teal-600"
            />
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
