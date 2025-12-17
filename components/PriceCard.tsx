import React from 'react';

interface PriceCardProps {
  title: string;
  value: number;
  isCurrency?: boolean;
  colorClass?: string;
  icon?: React.ReactNode;
}

const PriceCard: React.FC<PriceCardProps> = ({ title, value, isCurrency = true, colorClass = "text-white", icon }) => {
  const formattedValue = isCurrency 
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value)
    : value.toFixed(2);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg flex flex-col items-center justify-center transform transition-all hover:scale-105">
      <div className="flex items-center space-x-2 mb-2 text-slate-400 font-medium uppercase tracking-wider text-sm">
        {icon && <span>{icon}</span>}
        <span>{title}</span>
      </div>
      <div className={`text-3xl font-bold ${colorClass}`}>
        {formattedValue}
      </div>
    </div>
  );
};

export default PriceCard;
