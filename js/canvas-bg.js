/**
 * SENTINELGUARD AI - ANIMATIC PARTICLE CONSTELLATION CANVAS
 * Cyberpunk interactive dark canvas with particle constellations,
 * node linkages, and mouse interaction.
 */

(function () {
  const canvas = document.getElementById('anim-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  const particleCount = 65;
  const maxDistance = 140;

  const colors = [
    'rgba(0, 240, 255, ',    // Electric Cyan / Blue
    'rgba(56, 189, 248, ',   // Cyber Blue
    'rgba(255, 42, 95, ',    // Alert Crimson Red
    'rgba(251, 191, 36, ',   // Warning Gold
    'rgba(136, 19, 55, '     // Deep Maroon
  ];

  const mouse = {
    x: null,
    y: null,
    radius: 120
  };

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('mouseout', () => {
    mouse.x = null;
    mouse.y = null;
  });

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resize);
  resize();

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.85;
      this.vy = (Math.random() - 0.5) * 0.85;
      this.radius = Math.random() * 2 + 1.2;
      this.colorBase = colors[Math.floor(Math.random() * colors.length)];
      this.alpha = Math.random() * 0.5 + 0.3;
      this.pulseSpeed = Math.random() * 0.02 + 0.01;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;

      // Mouse attraction
      if (mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          this.x += (dx / dist) * force * 1.5;
          this.y += (dy / dist) * force * 1.5;
        }
      }

      // Subtle pulse
      this.alpha += Math.sin(Date.now() * this.pulseSpeed * 0.05) * 0.01;
      this.alpha = Math.max(0.2, Math.min(0.85, this.alpha));
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.colorBase + this.alpha + ')';
      ctx.shadowBlur = 10;
      ctx.shadowColor = this.colorBase + '0.8)';
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function initParticles() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }
  }

  function connectParticles() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDistance) {
          const alpha = (1 - dist / maxDistance) * 0.22;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }

    connectParticles();
    requestAnimationFrame(animate);
  }

  initParticles();
  animate();
})();
