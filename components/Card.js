// components/Card.js
import Image from 'next/image';
import Link from 'next/link';

export default function Card({ imageUrl, title, description, link }) {
  return (
    <div className="card">
      <div className="card-image">
        <Image src={imageUrl} alt={title} layout="fill" objectFit="cover" />
      </div>
      <div className="card-content">
        <h3 className="card-title">{title}</h3>
        <p>{description}</p>
        <Link href={link}>
          <a className="card-button">Learn More</a>
        </Link>
      </div>
    </div>
  );
}
