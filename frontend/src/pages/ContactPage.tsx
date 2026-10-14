import { Mail, MapPin, Phone } from 'lucide-react';

const contactItems = [
  { icon: Mail, label: 'Email', value: 'hello@weaveai.design' },
  { icon: Phone, label: 'Phone', value: '+91 98765 43210' },
  { icon: MapPin, label: 'Studio', value: 'Bengaluru, India' }
];

function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-12 lg:px-8">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7a564d]">Contact</p>
        <h1 className="mt-2 font-serif text-5xl text-[#382B27]">Let’s Build a Better Textile Future</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {contactItems.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-[28px] border border-[#e7dcc8] bg-white p-6 text-center shadow-soft">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#f3e7d9] text-[#70263A]">
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#7a564d]">{label}</p>
            <p className="mt-3 text-lg font-medium text-[#382B27]">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ContactPage;
