import { ArrowRight, BrainCircuit, ImageUp, Palette, Wand2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const steps = [
  {
    icon: ImageUp,
    title: 'Upload a Fabric Reference',
    description: 'Bring in an image of a textile, motif, or damaged restoration sample to begin pattern analysis.'
  },
  {
    icon: BrainCircuit,
    title: 'Inspect image quality',
    description: 'Review measured resolution, sharpness, contrast, and a heuristic low-quality-region overlay.'
  },
  {
    icon: Palette,
    title: 'Estimate a repeat',
    description: 'The current baseline estimates tile size and direction, then creates a simple repeated-tile preview. It is not a trained generative model.'
  },
  {
    icon: Wand2,
    title: 'Explore a colorway',
    description: 'Map a custom palette onto an uploaded textile while preserving source luminance and surface texture.'
  }
];

function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
      <div className="mb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7a564d]">Process overview</p>
        <h1 className="mt-2 font-serif text-5xl text-[#382B27]">How WeaveAI Works</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {steps.map(({ icon: Icon, title, description }) => (
          <div key={title} className="rounded-[30px] border border-[#e7dcc8] bg-white p-6 shadow-soft">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#f3e7d9] text-[#70263A]">
              <Icon className="h-6 w-6" />
            </div>
            <h2 className="font-serif text-3xl text-[#382B27]">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-[#5f4d49]">{description}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-[30px] border border-[#e7dcc8] bg-[#f7efe6] p-8 shadow-soft">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7a564d]">Built for artisans and designers</p>
            <h2 className="mt-2 font-serif text-4xl text-[#382B27]">Preserve pattern intelligence across generations.</h2>
          </div>
          <Link to="/upload" className="inline-flex items-center gap-2 rounded-full bg-[#b65335] px-5 py-3 text-sm font-medium text-white">
              Upload a fabric
            <ArrowRight className="h-4 w-4" />
            </Link>
        </div>
      </div>
    </div>
  );
}

export default HowItWorksPage;
