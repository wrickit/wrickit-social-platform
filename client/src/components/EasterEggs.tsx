import { useState, useEffect } from "react";

export default function EasterEggs() {
  const [showStars, setShowStars] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Konami Code Easter Egg
  useEffect(() => {
    const konamiCode = [
      'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
      'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
      'KeyB', 'KeyA'
    ];
    let konamiIndex = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
          // Trigger rainbow mode
          document.body.classList.add('rainbow-mode');
          setTimeout(() => {
            document.body.classList.remove('rainbow-mode');
          }, 10000);
          konamiIndex = 0;
        }
      } else {
        konamiIndex = 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Mouse trail effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      // Create sparkle effect on mouse move
      if (Math.random() > 0.95) {
        const sparkle = document.createElement('div');
        sparkle.className = 'mouse-sparkle';
        sparkle.style.left = e.clientX + 'px';
        sparkle.style.top = e.clientY + 'px';
        document.body.appendChild(sparkle);
        
        setTimeout(() => {
          sparkle.remove();
        }, 1000);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Random compliments
  const compliments = [
    "You're absolutely amazing! ✨",
    "Your vibes are immaculate! 💫",
    "Serving looks today! 💅",
    "Main character energy! 👑",
    "You're literally glowing! ✨",
    "No cap, you're incredible! 🧢",
    "That's so fetch! 💖"
  ];

  const showRandomCompliment = () => {
    const compliment = compliments[Math.floor(Math.random() * compliments.length)];
    const toast = document.createElement('div');
    toast.className = 'compliment-toast';
    toast.textContent = compliment;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  // Click the logo 10 times Easter egg
  useEffect(() => {
    let clickCount = 0;
    const handleLogoClick = () => {
      clickCount++;
      if (clickCount === 10) {
        showRandomCompliment();
        clickCount = 0;
      }
    };

    const logo = document.querySelector('h1');
    logo?.addEventListener('click', handleLogoClick);
    
    return () => {
      logo?.removeEventListener('click', handleLogoClick);
    };
  }, []);

  return null; // This component only adds event listeners
}