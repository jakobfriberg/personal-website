export interface CardData {
  id: number;
  title: string;
  content: string;
}

export const CARDS: CardData[] = [
  {
    id: 0,
    title: 'Hi there',
    content:
      "I'm Jakob. I work at the intersection of product, " +
      "engineering, and AI. " +
      "I like working on problems where the problem is clear, " +
      "but the solution isn't.",
  },
  {
    id: 1,
    title: 'Define...',
    content:
      'I help turn ideas, data, and messy processes into working ' +
      'software: a new product feature, an API, a data pipeline, ' +
      'an internal tool. ' +
      'It usually starts with figuring out what the right thing ' +
      'to build is.',
  },
  {
    id: 2,
    title: '...to...',
    content:
      'It comes down to three perspectives: the user, the ' +
      'business, and the technology. When you understand how ' +
      'they connect, the right solution tends to emerge.',
  },
  {
    id: 3,
    title: '...delight',
    content:
      "That groundwork is what lets you build something that " +
      "doesn't just work, but feels right to use. Something " +
      "delightful. The thing that makes customers stay and " +
      "spread the word."
  },
  {
    id: 4,
    title: 'So far',
    content:
      "I've worked in small and large organizations, " +
      'including Swish, SJ, PostNord, and 3M. Often on early ' +
      'projects and new initiatives where things are still ' +
      'being figured out.',
  },
  {
    id: 5,
    title: 'The process',
    content:
      'Early in a project, learning matters more than ' +
      'optimizing. I love talking to users, building ' +
      'prototypes, and seeing what sticks. Trust the process ' +
      'and you start to see glimpses of the right product.',
  },
  {
    id: 6,
    title: 'Tech stack',
    content:
      "I'm tech-agnostic and work with most things " +
      'thrown at me - Python, TypeScript, FastAPI, Next.js, ' +
      'Postgres, Supabase, GCP. I\'ve even dabbled with Kubernetes. ' +
      'The tech is usually the easy part. Deciding what to ' +
      'build is not.',
  },
  {
    id: 7,
    title: 'Background',
    content:
      'I started in materials science, which led me into data ' +
      'and analytics, and later into product development and AI. ' +
      "One thing has led to another but the common denominator has " +
      'always been the pursuit to be at the bleeding edge of technology.',
  },
  {
    id: 8,
    title: 'Contact',
    content:
      "If you're building something and need someone who can " +
      'move between product, engineering, and AI, feel free ' +
      'to reach out.',
  },
];
