export class BrickBreakerGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Game state
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        
        // Game objects
        this.paddle = {
            x: this.width / 2 - 50,
            y: this.height - 30,
            width: 100,
            height: 15,
            speed: 8
        };
        
        this.ball = {
            x: this.width / 2,
            y: this.height / 2,
            radius: 8,
            dx: 4,
            dy: -4,
            speed: 4
        };
        
        this.bricks = [];
        this.particles = [];
        
        // Input handling
        this.keys = {};
        this.mouseX = 0;
        
        this.setupEventListeners();
        this.initializeBricks();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
        });
    }
    
    initializeBricks() {
        this.bricks = [];
        const rows = 5 + this.level;
        const cols = 10;
        const brickWidth = (this.width - 100) / cols;
        const brickHeight = 20;
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                this.bricks.push({
                    x: 50 + col * brickWidth,
                    y: 50 + row * (brickHeight + 5),
                    width: brickWidth - 2,
                    height: brickHeight,
                    color: colors[row % colors.length],
                    destroyed: false,
                    points: (rows - row) * 10
                });
            }
        }
    }
    
    start() {
        this.gameState = 'playing';
        this.resetBall();
    }
    
    pause() {
        this.gameState = this.gameState === 'paused' ? 'playing' : 'paused';
    }
    
    resetBall() {
        this.ball.x = this.width / 2;
        this.ball.y = this.height / 2;
        this.ball.dx = (Math.random() > 0.5 ? 1 : -1) * this.ball.speed;
        this.ball.dy = -this.ball.speed;
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        // Update paddle
        if (this.keys['ArrowLeft'] || this.keys['a']) {
            this.paddle.x = Math.max(0, this.paddle.x - this.paddle.speed);
        }
        if (this.keys['ArrowRight'] || this.keys['d']) {
            this.paddle.x = Math.min(this.width - this.paddle.width, this.paddle.x + this.paddle.speed);
        }
        
        // Mouse control for paddle
        if (this.mouseX > 0) {
            this.paddle.x = Math.max(0, Math.min(this.width - this.paddle.width, this.mouseX - this.paddle.width / 2));
        }
        
        // Update ball
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;
        
        // Ball collision with walls
        if (this.ball.x <= this.ball.radius || this.ball.x >= this.width - this.ball.radius) {
            this.ball.dx = -this.ball.dx;
        }
        if (this.ball.y <= this.ball.radius) {
            this.ball.dy = -this.ball.dy;
        }
        
        // Ball collision with paddle
        if (this.ball.y + this.ball.radius >= this.paddle.y &&
            this.ball.x >= this.paddle.x &&
            this.ball.x <= this.paddle.x + this.paddle.width) {
            
            // Calculate bounce angle based on where ball hits paddle
            const hitPos = (this.ball.x - this.paddle.x) / this.paddle.width;
            const angle = (hitPos - 0.5) * Math.PI / 3; // Max 60 degrees
            
            this.ball.dx = Math.sin(angle) * this.ball.speed;
            this.ball.dy = -Math.cos(angle) * this.ball.speed;
            
            this.createParticles(this.ball.x, this.ball.y, '#FFFFFF');
        }
        
        // Ball collision with bricks
        for (let brick of this.bricks) {
            if (!brick.destroyed && this.checkBallBrickCollision(this.ball, brick)) {
                brick.destroyed = true;
                this.score += brick.points;
                this.ball.dy = -this.ball.dy;
                this.createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color);
                break;
            }
        }
        
        // Check if ball fell below paddle
        if (this.ball.y > this.height) {
            this.lives--;
            if (this.lives <= 0) {
                this.gameState = 'gameOver';
                return;
            }
            this.resetBall();
        }
        
        // Check if all bricks are destroyed
        if (this.bricks.every(brick => brick.destroyed)) {
            this.level++;
            this.ball.speed += 0.5;
            this.initializeBricks();
            this.resetBall();
        }
        
        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.x += particle.dx;
            particle.y += particle.dy;
            particle.life--;
            return particle.life > 0;
        });
    }
    
    checkBallBrickCollision(ball, brick) {
        return ball.x + ball.radius >= brick.x &&
               ball.x - ball.radius <= brick.x + brick.width &&
               ball.y + ball.radius >= brick.y &&
               ball.y - ball.radius <= brick.y + brick.height;
    }
    
    createParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                dx: (Math.random() - 0.5) * 6,
                dy: (Math.random() - 0.5) * 6,
                color: color,
                life: 30
            });
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000011';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw background pattern
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.width; i += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.height);
            this.ctx.stroke();
        }
        for (let i = 0; i < this.height; i += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.width, i);
            this.ctx.stroke();
        }
        
        // Draw bricks
        for (let brick of this.bricks) {
            if (!brick.destroyed) {
                this.ctx.fillStyle = brick.color;
                this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
                
                // Add brick border
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
            }
        }
        
        // Draw paddle
        const gradient = this.ctx.createLinearGradient(this.paddle.x, this.paddle.y, this.paddle.x, this.paddle.y + this.paddle.height);
        gradient.addColorStop(0, '#FF8C00');
        gradient.addColorStop(1, '#FF4500');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
        
        // Draw ball
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        const ballGradient = this.ctx.createRadialGradient(this.ball.x, this.ball.y, 0, this.ball.x, this.ball.y, this.ball.radius);
        ballGradient.addColorStop(0, '#FFFFFF');
        ballGradient.addColorStop(1, '#CCCCCC');
        this.ctx.fillStyle = ballGradient;
        this.ctx.fill();
        
        // Draw particles
        for (let particle of this.particles) {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life / 30;
            this.ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
        }
        this.ctx.globalAlpha = 1;
        
        // Draw pause overlay
        if (this.gameState === 'paused') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.width / 2, this.height / 2);
        }
    }
    
    getGameState() {
        return {
            score: this.score,
            level: this.level,
            lives: this.lives,
            gameState: this.gameState
        };
    }
    
    reset() {
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.ball.speed = 4;
        this.gameState = 'menu';
        this.initializeBricks();
        this.resetBall();
    }
}
