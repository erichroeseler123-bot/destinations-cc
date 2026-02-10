// components/HeroSection.tsx
export default function HeroSection() {
  return (
    <section className="hero">
      <div className="hero-overlay" />
      <div className="hero-content">
        <h1>Discover Epic Adventures</h1>
        <p>Curated tours, verified experiences & insider guides to the world's best destinations.</p>
        <a href="#destinations" className="cta-button">Explore Destinations</a>
      </div>
    </section>
  );
}
