'use client';

import type { Product } from '@/types/product';
import { Accordion } from '@/components/ui/Accordion';

interface ProductAccordionDetailsProps {
  product: Product;
}

export function ProductAccordionDetails({ product }: ProductAccordionDetailsProps) {
  const accordionItems = [
    {
      id: 'about',
      question: 'About This Namkeen',
      answer: (
        <div className="space-y-3 font-body text-dark-700 leading-relaxed text-sm">
          <p>{product.description}</p>
        </div>
      ),
    },
    {
      id: 'ingredients',
      question: 'Ingredients & Spice Level',
      answer: (
        <div className="space-y-3 font-body text-dark-700 leading-relaxed text-sm">
          {product.spiceLevel && (
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-dark-900">Spice Level:</span>
              <span className="capitalize font-bold text-saffron-600 bg-saffron-50 px-2.5 py-0.5 rounded-full border border-saffron-200 text-xs">
                {product.spiceLevel}
              </span>
            </div>
          )}
          <p><span className="font-semibold text-dark-900">Ingredients:</span> {product.ingredients}</p>
          <p className="text-xs text-dark-500 font-light italic">
            100% Pure Vegetarian. Contains no artificial preservatives, MSG, or synthetic food colours.
          </p>
        </div>
      ),
    },
  ];

  if (product.nutrition) {
    const nut = product.nutrition;
    accordionItems.push({
      id: 'nutrition',
      question: `Nutritional Info (per ${nut.servingSize})`,
      answer: (
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body text-xs text-dark-800 border-collapse">
            <thead>
              <tr className="border-b border-cream-200 bg-cream-100/60">
                <th className="py-2 px-3 font-bold">Nutrient</th>
                <th className="py-2 px-3 font-bold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              <tr>
                <td className="py-2 px-3">Energy / Calories</td>
                <td className="py-2 px-3 font-semibold text-maroon-900">{nut.calories} kcal</td>
              </tr>
              <tr>
                <td className="py-2 px-3">Total Fat</td>
                <td className="py-2 px-3">{nut.totalFat}</td>
              </tr>
              {nut.saturatedFat && (
                <tr>
                  <td className="py-2 px-3 pl-6 text-dark-500">• Saturated Fat</td>
                  <td className="py-2 px-3">{nut.saturatedFat}</td>
                </tr>
              )}
              <tr>
                <td className="py-2 px-3">Carbohydrates</td>
                <td className="py-2 px-3">{nut.carbohydrates}</td>
              </tr>
              {nut.sugar && (
                <tr>
                  <td className="py-2 px-3 pl-6 text-dark-500">• Sugar</td>
                  <td className="py-2 px-3">{nut.sugar}</td>
                </tr>
              )}
              <tr>
                <td className="py-2 px-3">Protein</td>
                <td className="py-2 px-3 font-semibold">{nut.protein}</td>
              </tr>
              <tr>
                <td className="py-2 px-3">Sodium</td>
                <td className="py-2 px-3">{nut.sodium}</td>
              </tr>
              {nut.fiber && (
                <tr>
                  <td className="py-2 px-3">Dietary Fiber</td>
                  <td className="py-2 px-3">{nut.fiber}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ),
    });
  }

  accordionItems.push({
    id: 'storage',
    question: 'Storage & Shelf Life',
    answer: (
      <div className="space-y-2 font-body text-dark-700 text-sm">
        <p><span className="font-semibold text-dark-900">Storage Instructions:</span> {product.storage}</p>
        <p><span className="font-semibold text-dark-900">Shelf Life:</span> {product.shelfLife}</p>
      </div>
    ),
  });

  accordionItems.push({
    id: 'shipping',
    question: 'Shipping & Freshness Guarantee',
    answer: (
      <div className="space-y-2 font-body text-dark-700 text-sm">
        <p>• Freshly prepared & dispatched within 24 hours of order placement.</p>
        <p>• Packed in multi-layer airtight moisture-resistant barrier pouches to retain crispness.</p>
        <p>• Free express shipping on all orders above ₹499 across India.</p>
      </div>
    ),
  });

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-cream-200/80 shadow-card">
      <Accordion items={accordionItems} allowMultiple />
    </div>
  );
}
