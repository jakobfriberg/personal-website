export interface PersonalItem {
  id: string;
  icon: string;
  label: string;
  description: string;
  top: string;
  left: string;
}

export const ITEMS: PersonalItem[] = [
  { id: 'music', icon: '\uD83C\uDFB5', label: 'Music', description: 'Placeholder \u2014 what I listen to.', top: '15%', left: '10%' },
  { id: 'coffee', icon: '\u2615', label: 'Coffee', description: 'Placeholder \u2014 how I take it.', top: '35%', left: '65%' },
  { id: 'travel', icon: '\u2708\uFE0F', label: 'Travel', description: "Placeholder \u2014 where I've been.", top: '60%', left: '25%' },
  { id: 'books', icon: '\uD83D\uDCDA', label: 'Books', description: 'Placeholder \u2014 what I read.', top: '20%', left: '45%' },
  { id: 'cooking', icon: '\uD83C\uDF73', label: 'Cooking', description: 'Placeholder \u2014 what I cook.', top: '55%', left: '75%' },
  { id: 'running', icon: '\uD83C\uDFC3', label: 'Running', description: 'Placeholder \u2014 how far I go.', top: '75%', left: '50%' },
  { id: 'film', icon: '\uD83C\uDFAC', label: 'Film', description: 'Placeholder \u2014 what I watch.', top: '40%', left: '15%' },
  { id: 'code', icon: '\u2328\uFE0F', label: 'Side projects', description: 'Placeholder \u2014 what I build for fun.', top: '80%', left: '10%' },
];
