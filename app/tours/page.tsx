// app/tours/page.tsx

import Link from 'next/link';

const toursData = [
  { title: 'Helicopter Tours', slug: 'helicopter-tours' },
  { title: 'Night Tours', slug: 'night-tours' },
  { title: 'City Tours', slug: 'city-tours' },
  { title: 'Local Attractions', slug: 'local-attractions' },
  { title: 'Shows', slug: 'shows' },
  { title: 'Hotels', slug: 'hotels' },
];

const ToursPage = () => {
  return (
    <main>
      <h1>Explore Our Tours</h1>
      <p>Choose from a variety of tours to experience the best of the destination!</p>

      <section>
        <h2>Tour Categories</h2>
        <ul>
          {toursData.map((tour) => (
            <li key={tour.slug}>
              <Link href={`/tours/${tour.slug}`}>
                <a>{tour.title}</a>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
};

export default ToursPage;
