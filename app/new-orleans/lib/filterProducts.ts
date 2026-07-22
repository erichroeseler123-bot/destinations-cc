import { LiveProductAdapter, ActiveFilter } from '../data/types';

export function filterProducts(products: LiveProductAdapter[], activeFilters: ActiveFilter[]): LiveProductAdapter[] {
  if (activeFilters.length === 0) return products;

  return products.filter(product => {
    return activeFilters.every(filter => {
      switch (filter.field) {
        case 'category':
          return product.categoryIds.includes(filter.value);
        case 'daypart':
          return product.daypart === filter.value;
        case 'pickup':
          return product.hotelPickup === (filter.value === 'yes');
        case 'self-drive':
          return product.selfDrive === (filter.value === 'yes');
        case 'indoor/outdoor':
          return product.indoorOutdoor === filter.value;
        case 'walking level':
          return product.walkingLevel === filter.value;
        case 'transportation':
          return product.transportation === filter.value;
        case 'instant confirmation':
          return product.instantConfirmation === (filter.value === 'yes');
        default:
          return true; // Unknown filters are ignored rather than failing
      }
    });
  });
}

// Generate valid filter options strictly from data
export function generateFilterOptions(products: LiveProductAdapter[]) {
  const filters: { id: string, label: string, options: { label: string, value: string }[] }[] = [];

  const addFilterIfValuesExist = (id: string, label: string, getter: (p: LiveProductAdapter) => string | boolean | null | undefined) => {
    const values = new Set<string>();
    products.forEach(p => {
      const val = getter(p);
      if (val !== null && val !== undefined) {
        if (typeof val === 'boolean') {
          values.add(val ? 'yes' : 'no');
        } else {
          values.add(val as string);
        }
      }
    });
    if (values.size > 0) {
      filters.push({
        id,
        label,
        options: Array.from(values).map(v => ({ label: v.charAt(0).toUpperCase() + v.slice(1), value: v }))
      });
    }
  };

  addFilterIfValuesExist('daypart', 'Time of Day', p => p.daypart);
  addFilterIfValuesExist('pickup', 'Hotel Pickup', p => p.hotelPickup);
  addFilterIfValuesExist('self-drive', 'Self Drive', p => p.selfDrive);
  addFilterIfValuesExist('indoor/outdoor', 'Environment', p => p.indoorOutdoor);
  addFilterIfValuesExist('walking level', 'Walking Level', p => p.walkingLevel);
  addFilterIfValuesExist('transportation', 'Transportation', p => p.transportation);
  addFilterIfValuesExist('instant confirmation', 'Instant Confirmation', p => p.instantConfirmation);

  return filters;
}
