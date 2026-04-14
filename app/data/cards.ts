export interface CardLink {
  label: string;
  url: string;
}

export interface CardData {
  id: number;
  title: string;
  content: string;
  link?: CardLink;
}

export const CARDS: CardData[] = [
  {
    id: 0,
    title: 'Hi there',
    content:
    "I'm Jakob. I work at the intersection of product, " +
    "engineering, and AI. " +
    "I'm focused on the early stage of projects, taking ambiguous problems " +
    "and turning them into working solutions.",
    link: {
      label: 'Connect with me',
      url: 'https://www.linkedin.com/in/jakob-friberg-b61261105',
    },
  },
  {
    id: 1,
    title: 'Understand...',
    content:
      'The most underestimated part of any project is figuring ' +
      'out what to build. I start with the problem - talking to ' +
      'stakeholders, understanding the business, mapping out what ' +
      'a good solution looks like before writing code.',
  },
  {
    id: 2,
    title: '...then...',
    content:
      'It comes down to three perspectives: the user, the ' +
      'business, and the technology. When you understand how ' +
      "they connect, the path to the right solution tends to emerge.",
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
      "I've delivered solutions for clients including IKEA, " +
      'Swish, PostNord, SJ, and Södra, and co-founded an ' +
      'AI startup from scratch. I love working on early ' +
      'projects where things are still being figured out.',
  },
  {
    id: 5,
    title: 'My process',
    content:
      'Early in a project, learning matters more than ' +
      'optimizing. I talk to users, build prototypes, and test ' +
      "assumptions. What's the actual business outcome? What " +
      'does success look like? Get that right and the product ' +
      'follows.',
  },
  {
    id: 6,
    title: 'Tech stack',
    content:
      "I'm a tech-agnostic comfortable with most things " +
      "- Python, FastAPI, Next.js, Vertex AI, Supabase, Cloud infra. " +
      "I've built generative AI systems, data " +
      'pipelines, and full-stack apps. The tech is usually the ' +
      'easy part. Deciding what to build is not.',
  },
  {
    id: 7,
    title: 'Background',
    content:
      'I started in materials science, which led me into data ' +
      'and analytics, and later into product development and ' +
      'AI. The common theme has always been curiosity - ' +
      "working at the bleeding edge of technology. ",
  },
  {
    id: 8,
    title: 'Contact',
    content:
      "If you're building something in the early stage and " +
      'need someone who can take it from abstract idea to ' +
      'working solution, feel free to reach out.',
    link: {
      label: 'Email me',
      url: 'mailto:jakobfriberg1@gmail.com',
    },
  },
];
