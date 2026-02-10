import Link from 'next/link';

// This component expects the 'path' as a prop, which should be an array of objects with 'name' and 'url' properties.
const Breadcrumb = ({ path }) => {
  return (
    <nav>
      <ul className="breadcrumb">
        {path.map((part, index) => (
          <li key={index}>
            {index < path.length - 1 ? (
              <Link href={part.url}>{part.name}</Link>
            ) : (
              <span>{part.name}</span> // last part is not a link
            )}
            {index < path.length - 1 && ' > '}
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Breadcrumb;
