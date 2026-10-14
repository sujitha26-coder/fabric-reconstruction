import { useState } from 'react';
import { Heart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { FabricItem } from '../../types';

interface FabricCardProps {
  item: FabricItem;
}

function FabricCard({ item }: FabricCardProps) {
  const [saved, setSaved] = useState(() => {
    try {
      const savedIds = JSON.parse(localStorage.getItem('weaveai-favorites') ?? '[]') as string[];
      return savedIds.includes(item.id);
    } catch {
      return false;
    }
  });

  const toggleSaved = () => {
    try {
      const savedIds = JSON.parse(localStorage.getItem('weaveai-favorites') ?? '[]') as string[];
      const nextIds = saved ? savedIds.filter((id) => id !== item.id) : [...new Set([...savedIds, item.id])];
      localStorage.setItem('weaveai-favorites', JSON.stringify(nextIds));
      setSaved(!saved);
    } catch {
      setSaved(false);
    }
  };

  return (
    <article className="group min-w-0 overflow-hidden rounded-lg border border-[#ede1d5] bg-[#fffdf9] transition hover:-translate-y-0.5 hover:border-[#d7baa0]">
      <div className="relative aspect-[1.05/1] overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <span className="absolute left-2.5 top-2.5 rounded-full bg-[#fffdf9]/90 px-2.5 py-1 text-[9px] font-medium text-[#87412d] backdrop-blur-sm">
          {item.category}
        </span>
        <button
          type="button"
          aria-label={saved ? `Remove ${item.name} from favourites` : `Save ${item.name} to favourites`}
          aria-pressed={saved}
          onClick={toggleSaved}
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full border border-white/80 bg-white/85 text-[#87412d] transition hover:bg-white"
        >
          <Heart className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="flex min-h-[128px] flex-col justify-between gap-3 p-3">
        <div>
          <h3 className="font-serif text-lg leading-tight text-[#3f3029]">{item.name}</h3>
          <p className="mt-1.5 line-clamp-2 text-[11px] leading-[1.5] text-[#8c7c70]">{item.description}</p>
        </div>

        <Link
          to={`/analysis/${item.id}`}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-[#ad583b] transition hover:text-[#87412d]"
        >
          View Details <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}

export default FabricCard;
