import { Star } from "lucide-react";

type Testimonial = {
  id: number;
  name: string;
  role: string;
  avatar: string;
  content: string;
  rating: number;
};

export default function TestimonialCard({ testimonial: t }: { testimonial: Testimonial }) {
  return (
    <div className="p-6 bg-white/[0.03] border border-white/10 rounded-2xl hover:border-[#E8B800]/30 transition-all">
      <div className="flex gap-0.5 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={14}
            className={i < t.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-700"}
          />
        ))}
      </div>
      <p className="text-gray-400 text-sm leading-relaxed mb-6 italic">&ldquo;{t.content}&rdquo;</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E8B800] to-[#27A827] flex items-center justify-center text-black text-sm font-bold">
          {t.avatar}
        </div>
        <div>
          <p className="text-white font-medium text-sm">{t.name}</p>
          <p className="text-gray-600 text-xs">{t.role}</p>
        </div>
      </div>
    </div>
  );
}
