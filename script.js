// ========== 烟花特效系统（修复版）==========

const canvas = document.getElementById('fireworks-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let fireworks = [];
let particles = [];
let stars = [];

// 配色方案 - 多元日系糖果色
const colors = [
    '#e8a4c8', // 樱花粉
    '#a8d5ba', // 薄荷绿
    '#b8a8d8', // 薰衣草紫
    '#f0c8a8', // 蜜桃色
    '#a8c8e8', // 天空蓝
    '#e8a8a0', // 珊瑚色
    '#d484b0', // 深粉
    '#c8e0d0', // 淡绿
];

// 背景色（与CSS中的 --bg-deep 一致）
const BG_COLOR = 'rgb(26, 22, 37)';

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// ========== 背景星星 ==========
class Star {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 1.5 + 0.5;
        this.opacity = Math.random() * 0.5 + 0.2;
        this.twinkleSpeed = Math.random() * 0.02 + 0.01;
        this.twinkleDir = 1;
    }

    update() {
        this.opacity += this.twinkleSpeed * this.twinkleDir;
        if (this.opacity > 0.7 || this.opacity < 0.1) {
            this.twinkleDir *= -1;
        }
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = '#e8d8f0';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// 初始化背景星星
for (let i = 0; i < 60; i++) {
    stars.push(new Star());
}

// ========== 烟花粒子 ==========
class FireworkParticle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 0.5;  // 降低爆炸扩散速度
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        this.friction = 0.97;  // 增加摩擦力让粒子更快减速
        this.gravity = 0.06;   // 降低重力
        this.opacity = 1;
        this.fadeRate = Math.random() * 0.012 + 0.006;
        this.size = Math.random() * 2 + 0.8;  // 粒子更小更精致
        
        this.hasTrail = Math.random() > 0.8;  // 更少拖尾，更干净
        this.trail = [];
    }

    update() {
        if (this.hasTrail) {
            this.trail.push({ x: this.x, y: this.y, opacity: this.opacity * 0.4 });
            if (this.trail.length > 3) this.trail.shift();  // 更短拖尾
        }
        
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.opacity -= this.fadeRate;
    }

    draw() {
        // 绘制拖尾
        if (this.hasTrail) {
            this.trail.forEach((point, i) => {
                ctx.save();
                ctx.globalAlpha = point.opacity * (i / this.trail.length) * 0.5;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(point.x, point.y, this.size * 0.4, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
        }
        
        // 绘制主体
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        
        // 柔和发光
        ctx.shadowBlur = 6;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// ========== 烟花主体 ==========
class Firework {
    constructor(isManual = false, targetX = null, targetY = null) {
        this.x = isManual ? targetX : Math.random() * width * 0.8 + width * 0.1;
        this.y = height;
        this.targetY = targetY || (Math.random() * height * 0.35 + height * 0.15);
        this.speed = isManual ? 5 : (Math.random() * 2 + 2.5);  // 降低上升速度
        this.angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.2;
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.trail = [];
        this.exploded = false;
        this.trailLength = 10;  // 更短尾迹
    }

    update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.trailLength) this.trail.shift();
        
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.08;  // 降低重力加速度
        
        // 到达目标高度或速度变负时爆炸
        if (this.y <= this.targetY || this.vy >= -0.5) {
            this.explode();
        }
    }

    explode() {
        this.exploded = true;
        const particleCount = Math.random() * 20 + 30;  // 减少粒子数量
        
        for (let i = 0; i < particleCount; i++) {
            particles.push(new FireworkParticle(this.x, this.y, this.color));
        }
        
        // 添加一些不同颜色的粒子
        const secondaryColor = colors[Math.floor(Math.random() * colors.length)];
        for (let i = 0; i < 10; i++) {
            particles.push(new FireworkParticle(this.x, this.y, secondaryColor));
        }
    }

    draw() {
        // 绘制尾迹
        ctx.save();
        this.trail.forEach((point, i) => {
            const alpha = (i / this.trail.length) * 0.5;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(point.x, point.y, 1.5, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
        
        // 绘制头部
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// ========== 动画循环 ==========
let lastFirework = 0;
let fireworkInterval = 1500;  // 增加间隔，烟花更少更从容

function animate(timestamp) {
    // 修复1：完全清除画布，用纯色填充，背景不会变淡
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, width, height);
    
    // 绘制背景星星
    stars.forEach(star => {
        star.update();
        star.draw();
    });
    
    // 自动生成烟花
    if (timestamp - lastFirework > fireworkInterval) {
        fireworks.push(new Firework());
        lastFirework = timestamp;
        fireworkInterval = Math.random() * 1000 + 800;  // 1.8-2.8秒间隔
    }
    
    // 更新烟花
    fireworks = fireworks.filter(fw => {
        if (!fw.exploded) {
            fw.update();
            fw.draw();
            return true;
        }
        return false;
    });
    
    // 更新粒子
    particles = particles.filter(p => {
        p.update();
        p.draw();
        return p.opacity > 0 && p.y < height + 50;
    });
    
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

// ========== 鼠标交互 - 点击放烟花 ==========
document.addEventListener('click', (e) => {
    if (e.target.closest('.navbar')) return;
    if (e.target.closest('a')) return;  // 也忽略链接点击
    
    const fw = new Firework(true, e.clientX, e.clientY);
    fireworks.push(fw);
});

// ========== 头像加载失败备用 ==========
document.getElementById('avatar-img').addEventListener('error', function() {
    this.style.background = 'linear-gradient(135deg, #e8a4c8, #b8a8d8)';
    this.style.display = 'flex';
    this.style.alignItems = 'center';
    this.style.justifyContent = 'center';
    this.style.color = '#fff';
    this.style.fontSize = '2rem';
    this.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    this.parentElement.innerHTML += '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:2rem;">★</div>';
});