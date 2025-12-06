import React, { useState, useEffect, useCallback, useRef } from 'react';
// Menggunakan ethers.js untuk interaksi blockchain
import { ethers } from 'https://cdn.ethers.io/lib/ethers-5.7.esm.min.js';
// Lucide React Icons
import { Gift, Dices, TrendingUp, Wallet, CheckCircle, XCircle, Zap, Shield, Loader, AlertTriangle, Menu } from 'lucide-react';

// --- KONFIGURASI WEB3 KRITIS ---
// CATATAN PENTING: GANTI NILAI DI BAWAH INI DENGAN DATA KONTAK SEBENARNYA!
const CONTRACT_ADDRESS = "0xD76b767102F2610B0C97FEE84873c1fAa4C7C365"; // Contoh Address
const ABI_JSON = '[{"inputs":[{"internalType":"address","name":"_treasury","type":"address"},{"internalType":"uint256","name":"_startFeeWei","type":"uint256"},{"internalType":"uint256","name":"_maxScorePerSubmit","type":"uint256"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"player","type":"address"},{"indexed":false,"internalType":"uint256","name":"fee","type":"uint256"}],"name":"GameStarted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"player","type":"address"},{"indexed":false,"internalType":"uint256","name":"score","type":"uint256"}],"name":"ScoreSubmitted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Withdraw","type":"event"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"allPlayers","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getTop10","outputs":[{"internalType":"address[]","name":"topPlayers","type":"address[]"},{"internalType":"uint256[]","name":"scores","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"maxScorePerSubmit","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"players","outputs":[{"internalType":"uint256","name":"totalScore","type":"uint256"},{"internalType":"uint256","name":"lastPlayed","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"startFeeWei","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"startGame","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"score","type":"uint256"}],"name":"submitScore","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"}]';
const ABI = JSON.parse(ABI_JSON);

// --- KONFIGURASI GAME ---
const MAP_WIDTH = 21;
const MAP_HEIGHT = 21;
const TILE_SIZE = 20; // Ukuran sel dalam piksel
const GHOST_COUNT = 4;
const INITIAL_MAP = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];
const PACMAN_START = { x: 10, y: 19 };
const GHOST_START_POSITIONS = [
    { x: 9, y: 8, color: '#0000FF' }, // Grinch 1 (Biru) - Melambangkan Grinch
    { x: 11, y: 8, color: '#00FFFF' }, // Grinch 2 (Cyan)
    { x: 10, y: 7, color: '#FF00FF' }, // Grinch 3 (Magenta)
    { x: 10, y: 8, color: '#FFFF00' }  // Grinch 4 (Kuning)
];

// Inisialisasi peta dan power pellet (angka 2)
function initializeGameMap() {
    const map = INITIAL_MAP.map(row => [...row]);
    // Tambahkan Power Pellet (nilai 2) di 4 sudut strategis
    map[1][1] = 2;
    map[1][19] = 2;
    map[MAP_HEIGHT - 3][1] = 2;
    map[MAP_HEIGHT - 3][19] = 2;
    return map;
}

function countDots(map) {
    return map.flat().filter(tile => tile === 0 || tile === 2).length;
}

const initialGameState = {
    map: initializeGameMap(),
    pacman: PACMAN_START,
    direction: 'RIGHT',
    score: 0,
    ghosts: GHOST_START_POSITIONS.map(pos => ({
        ...pos,
        x: pos.x,
        y: pos.y,
        direction: 'UP',
        isFrightened: false,
        isEaten: false,
        isRespawning: false,
        respawnTimer: 0,
    })),
    isPowerActive: false,
    powerTimer: 0,
    remainingDots: countDots(initializeGameMap()),
};

// Komponen Loader Sederhana
const LoadingSpinner = ({ message = "Memproses..." }) => (
    <div className="flex items-center justify-center space-x-2 p-4">
        <Loader className="w-5 h-5 animate-spin text-green-400" />
        <span className="text-sm font-medium text-green-200">{message}</span>
    </div>
);

// Komponen utama aplikasi
const App = () => {
    const [gameState, setGameState] = useState(initialGameState);
    const [status, setStatus] = useState('MAIN_MENU'); // MAIN_MENU, WAITING_FOR_START, PLAYING, GAME_OVER, GAME_WIN, LEADERBOARD
    const [web3Status, setWeb3Status] = useState({
        connected: false,
        address: null,
        loading: false,
        error: null,
        message: 'Silahkan Hubungkan Dompet Somnia Anda',
    });
    const [contractData, setContractData] = useState({
        leaderboard: [],
        totalScore: 0,
        feeWei: null, // Biaya yang diambil dari Kontrak
        maxScore: null, // Max score per submit
    });
    const gameIntervalRef = useRef(null);
    const lastUpdateTimeRef = useRef(Date.now());
    const [displayName, setDisplayName] = useState('');
    const [currentScoreSubmitted, setCurrentScoreSubmitted] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false); // Untuk mobile sidebar

    // Ethers Provider dan Signer (global untuk kemudahan akses)
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);

    // --- LOGIKA WEB3: KONEKSI DOMPET ---

    const connectWallet = useCallback(async () => {
        if (!window.ethereum) {
            setWeb3Status(s => ({ ...s, error: 'MetaMask atau dompet Web3 tidak terdeteksi.', message: 'Instal ekstensi dompet atau gunakan browser DApp.' }));
            return;
        }
        setWeb3Status(s => ({ ...s, loading: true, error: null, message: 'Menghubungkan ke dompet...' }));
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            const localProvider = new ethers.providers.Web3Provider(window.ethereum);
            setProvider(localProvider);
            const localSigner = localProvider.getSigner();
            setSigner(localSigner);
            const address = await localSigner.getAddress();

            // Verifikasi Somnia Mainnet (Chain ID 1729)
            const { chainId } = await localProvider.getNetwork();
            if (chainId !== 1729) {
                setWeb3Status(s => ({
                    ...s, connected: false, loading: false,
                    error: `Jaringan Salah! Pindah ke Somnia Mainnet (Chain ID 1729).`, message: 'Koneksi Gagal.',
                }));
                return;
            }

            setWeb3Status(s => ({
                ...s, connected: true, address: address, loading: false,
                message: 'Dompet Terhubung. Somnia Mainnet Aktif.', error: null,
            }));
            window.ethereum.on('accountsChanged', () => window.location.reload());
            window.ethereum.on('chainChanged', () => window.location.reload());
        } catch (error) {
            console.error("Koneksi Dompet Gagal:", error);
            setWeb3Status(s => ({
                ...s, connected: false, loading: false,
                error: `Koneksi ditolak atau terjadi kesalahan.`, message: 'Koneksi Gagal.',
            }));
        }
    }, []);

    // --- LOGIKA KONTRAK: BACA DATA & INSTANCE ---

    const getContractInstance = useCallback((readOnly = true) => {
        if (!provider) return null;
        if (readOnly) {
            return new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
        } else {
            if (!signer) return null;
            return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
        }
    }, [provider, signer]);

    const fetchData = useCallback(async (address) => {
        if (!provider) return;
        const contract = getContractInstance(true);
        if (!contract) return;
        setWeb3Status(s => ({ ...s, loading: true, error: null, message: 'Mengambil data kontrak...' }));

        try {
            const [players, scores] = await contract.getTop10();
            const leaderboard = players.map((addr, index) => ({
                address: addr,
                score: scores[index].toString(),
            }));

            let totalScore = 0;
            if (address) {
                const playerData = await contract.players(address);
                totalScore = playerData.totalScore.toString();
            }

            const feeWei = await contract.startFeeWei();
            const maxScore = await contract.maxScorePerSubmit();

            setContractData({ leaderboard, totalScore, feeWei: feeWei.toString(), maxScore: maxScore.toString() });
        } catch (error) {
            console.error("Gagal mengambil data kontrak:", error);
            setWeb3Status(s => ({ ...s, error: 'Gagal memuat data dari Leaderboard Contract.', message: 'Koneksi Gagal.', }));
        } finally {
            setWeb3Status(s => ({ ...s, loading: false }));
        }
    }, [provider, getContractInstance]);

    useEffect(() => {
        if (web3Status.connected && web3Status.address) {
            fetchData(web3Status.address);
        }
    }, [web3Status.connected, web3Status.address, fetchData]);


    // --- LOGIKA KONTRAK: TRANSAKSI (WRITE) ---

    const handleStartGame = async () => {
        if (!web3Status.connected || !signer || !contractData.feeWei) {
            setWeb3Status(s => ({ ...s, error: 'Harap hubungkan dompet Anda terlebih dahulu atau data kontrak belum dimuat.' }));
            return;
        }
        setWeb3Status(s => ({ ...s, loading: true, error: null, message: 'Memulai game (menunggu konfirmasi transaksi)...' }));

        try {
            const contract = getContractInstance(false);
            const fee = ethers.BigNumber.from(contractData.feeWei);
            const tx = await contract.startGame({ value: fee });

            setWeb3Status(s => ({ ...s, message: 'Transaksi startGame dikirim. Menunggu konfirmasi...' }));
            await tx.wait(); 

            setWeb3Status(s => ({ ...s, loading: false, message: 'Game Berhasil Dimulai! Transaksi terkonfirmasi.' }));
            setGameState(initialGameState);
            setStatus('PLAYING');
            setCurrentScoreSubmitted(false);

        } catch (error) {
            console.error("Transaksi startGame Gagal:", error);
            setWeb3Status(s => ({
                ...s, loading: false,
                error: `Gagal Memulai Game: ${error.message.includes('insufficient funds') ? 'Dana tidak mencukupi.' : error.message.includes('user rejected') ? 'Transaksi dibatalkan.' : 'Transaksi Gagal.'}`,
                message: 'Transaksi Gagal.',
            }));
        }
    };

    const handleSubmitScore = async (finalScore) => {
        if (!web3Status.connected || !signer || currentScoreSubmitted) {
            console.error("Dompet belum terhubung atau skor sudah dikirim.");
            return;
        }

        setWeb3Status(s => ({ ...s, loading: true, error: null, message: `Mengirim skor ${finalScore} ke Somnia Mainnet...` }));

        try {
            const contract = getContractInstance(false);
            const scoreBN = ethers.BigNumber.from(finalScore);

            const tx = await contract.submitScore(scoreBN);
            setWeb3Status(s => ({ ...s, message: 'Transaksi submitScore dikirim. Menunggu konfirmasi...' }));
            await tx.wait(); 

            setWeb3Status(s => ({ ...s, loading: false, message: 'Skor Berhasil Dicatat di Leaderboard!' }));
            setCurrentScoreSubmitted(true);
            fetchData(web3Status.address);

        } catch (error) {
            console.error("Transaksi submitScore Gagal:", error);
            setWeb3Status(s => ({
                ...s, loading: false,
                error: `Gagal Mencatat Skor: ${error.message.includes('user rejected') ? 'Transaksi dibatalkan.' : 'Transaksi Gagal.'}`,
                message: 'Transaksi Gagal.',
            }));
        }
    };


    // --- LOGIKA GAME (Pergerakan dan Tabrakan) ---

    const moveGhost = (ghost, map, pacmanPos) => {
        const moves = [
            { dx: 0, dy: -1, dir: 'UP' }, { dx: 0, dy: 1, dir: 'DOWN' },
            { dx: -1, dy: 0, dir: 'LEFT' }, { dx: 1, dy: 0, dir: 'RIGHT' },
        ];
        let bestMove = null;
        let minDistance = Infinity;
        const targetPos = ghost.isFrightened ? pacmanPos : { x: pacmanPos.x, y: pacmanPos.y };

        for (const move of moves) {
            const nextX = ghost.x + move.dx;
            const nextY = ghost.y + move.dy;
            if (nextX >= 0 && nextX < MAP_WIDTH && nextY >= 0 && nextY < MAP_HEIGHT && map[nextY][nextX] !== 1) {
                if ((move.dir === 'UP' && ghost.direction !== 'DOWN') ||
                    (move.dir === 'DOWN' && ghost.direction !== 'UP') ||
                    (move.dir === 'LEFT' && ghost.direction !== 'RIGHT') ||
                    (move.dir === 'RIGHT' && ghost.direction !== 'LEFT')) {
                    
                    const distance = Math.hypot(targetPos.x - nextX, targetPos.y - nextY);

                    if (ghost.isFrightened) {
                        if (distance > minDistance) { // Lari (jarak maksimum)
                            minDistance = distance;
                            bestMove = move;
                        }
                    } else {
                        if (distance < minDistance) { // Kejar (jarak minimum)
                            minDistance = distance;
                            bestMove = move;
                        }
                    }
                }
            }
        }

        if (bestMove) {
            return {
                x: ghost.x + bestMove.dx,
                y: ghost.y + bestMove.dy,
                direction: bestMove.dir,
            };
        }
        return ghost;
    };

    const gameLoop = useCallback(() => {
        const now = Date.now();
        const deltaTime = (now - lastUpdateTimeRef.current) / 1000;
        lastUpdateTimeRef.current = now;

        setGameState(prev => {
            if (prev.status === 'GAME_OVER' || prev.status === 'GAME_WIN') return prev;

            let newMap = prev.map.map(row => [...row]);
            let newPacman = { ...prev.pacman };
            let newScore = prev.score;
            let newGhosts = prev.ghosts.map(g => ({ ...g }));
            let newPowerTimer = prev.powerTimer;
            let newIsPowerActive = prev.isPowerActive;
            let newRemainingDots = prev.remainingDots;
            let currentStatus = 'PLAYING';

            // --- Gerak Sinterklas ---
            const nextPacman = { x: newPacman.x, y: newPacman.y };
            let moved = false;
            switch (prev.direction) {
                case 'UP': nextPacman.y -= 1; moved = true; break;
                case 'DOWN': nextPacman.y += 1; moved = true; break;
                case 'LEFT': nextPacman.x -= 1; moved = true; break;
                case 'RIGHT': nextPacman.x += 1; moved = true; break;
                default: break;
            }

            if (moved && nextPacman.x >= 0 && nextPacman.x < MAP_WIDTH && nextPacman.y >= 0 && nextPacman.y < MAP_HEIGHT && newMap[nextPacman.y][nextPacman.x] !== 1) {
                newPacman = nextPacman;

                if (newMap[newPacman.y][newPacman.x] === 0) { // Dot (Permen Batang)
                    newScore += 10;
                    newMap[newPacman.y][newPacman.x] = 3; 
                    newRemainingDots -= 1;
                }
                if (newMap[newPacman.y][newPacman.x] === 2) { // Power Pellet (Bintang Emas)
                    newScore += 50;
                    newMap[newPacman.y][newPacman.x] = 3; 
                    newRemainingDots -= 1;
                    newIsPowerActive = true;
                    newPowerTimer = 10; 
                    newGhosts = newGhosts.map(g => ({
                        ...g,
                        isFrightened: g.isEaten ? false : true,
                        isEaten: false,
                    }));
                }
            }

            // --- Timer Power Mode ---
            if (newIsPowerActive) {
                newPowerTimer -= deltaTime;
                if (newPowerTimer <= 0) {
                    newIsPowerActive = false;
                    newPowerTimer = 0;
                    newGhosts = newGhosts.map(g => ({ ...g, isFrightened: false, }));
                }
            }

            // --- Gerak Grinch (Hantu) ---
            newGhosts = newGhosts.map(ghost => {
                // Logika Respawn Time
                if (ghost.isEaten && ghost.respawnTimer > 0) {
                    return { ...ghost, respawnTimer: ghost.respawnTimer - deltaTime };
                }
                if (ghost.isEaten && ghost.respawnTimer <= 0) {
                    const initialPos = GHOST_START_POSITIONS.find(p => p.color === ghost.color) || GHOST_START_POSITIONS[0];
                    return {
                        ...ghost, x: initialPos.x, y: initialPos.y,
                        isEaten: false, isFrightened: newIsPowerActive, isRespawning: false,
                    };
                }

                const nextGhost = moveGhost(ghost, newMap, newPacman);
                return { ...ghost, ...nextGhost };
            });

            // --- Cek Tabrakan ---
            for (let i = 0; i < newGhosts.length; i++) {
                const ghost = newGhosts[i];
                if (ghost.x === newPacman.x && ghost.y === newPacman.y) {
                    if (newIsPowerActive && !ghost.isEaten) {
                        // Kasus 1: Tangkap Grinch
                        newScore += 200;
                        newGhosts[i] = {
                            ...ghost, isEaten: true, isFrightened: false, respawnTimer: 5,
                        };
                    } else if (!newIsPowerActive && !ghost.isEaten) {
                        // Kasus 2: Grinch Menang
                        currentStatus = 'GAME_OVER';
                        if (!currentScoreSubmitted) handleSubmitScore(newScore);
                        break;
                    }
                }
            }

            // --- Cek Kemenangan ---
            if (newRemainingDots === 0) {
                currentStatus = 'GAME_WIN';
                 if (!currentScoreSubmitted) handleSubmitScore(newScore);
            }

            return {
                ...prev, map: newMap, pacman: newPacman, score: newScore, ghosts: newGhosts,
                isPowerActive: newIsPowerActive, powerTimer: newPowerTimer, remainingDots: newRemainingDots,
                status: currentStatus,
            };
        });
    }, [handleSubmitScore, currentScoreSubmitted]);


    // Effect untuk loop dan input
    useEffect(() => {
        if (status === 'PLAYING') {
            gameIntervalRef.current = setInterval(gameLoop, 200);
        } else if (gameIntervalRef.current) {
            clearInterval(gameIntervalRef.current);
            gameIntervalRef.current = null;
        }
        return () => {
            if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
        };
    }, [status, gameLoop]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            let newDirection = null;
            if (['ArrowUp', 'w', 'W'].includes(e.key)) newDirection = 'UP';
            else if (['ArrowDown', 's', 'S'].includes(e.key)) newDirection = 'DOWN';
            else if (['ArrowLeft', 'a', 'A'].includes(e.key)) newDirection = 'LEFT';
            else if (['ArrowRight', 'd', 'D'].includes(e.key)) newDirection = 'RIGHT';

            if (newDirection && status === 'PLAYING') {
                e.preventDefault();
                setGameState(prev => ({ ...prev, direction: newDirection }));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [status]);


    // --- RENDERING TILE KHUSUS (SESUAI GAMBAR) ---
    const renderTile = (tile, x, y) => {
        const isPacman = gameState.pacman.x === x && gameState.pacman.y === y;
        const ghost = gameState.ghosts.find(g => g.x === x && g.y === y && !g.isEaten);

        let content = null;
        let classes = 'flex items-center justify-center relative';
        
        // Background Jalur
        classes += ' bg-green-900 border-2 border-green-800';

        if (tile === 1) { 
            // Dinding: Striped Red and White (Candy Cane Look)
            classes = 'bg-repeat bg-center border-white/50 border-2 shadow-inner shadow-gray-900/50'
            const stripeStyle = {
                backgroundImage: 'linear-gradient(45deg, #FF0000 25%, #FFFFFF 25%, #FFFFFF 50%, #FF0000 50%, #FF0000 75%, #FFFFFF 75%, #FFFFFF 100%)',
                backgroundSize: `${TILE_SIZE/2}px ${TILE_SIZE/2}px`,
            };
            return <div key={`${x}-${y}`} className={classes} style={{ width: TILE_SIZE, height: TILE_SIZE, ...stripeStyle }}></div>;
        } 
        
        // Konten Dot atau Pellet
        if (tile === 0) {
            // Permen Batang (Dot)
            content = <div className="w-2 h-2 bg-red-400 rounded-full shadow-lg"></div>;
        } else if (tile === 2) {
            // Bintang Emas (Power Pellet)
            content = <div className="text-xl animate-pulse">⭐</div>;
        }

        // Karakter
        if (isPacman) {
            // Sinterklas
            content = (
                <div className={`text-2xl transition-transform duration-100 ${gameState.isPowerActive ? 'scale-125' : 'scale-100'}`}>
                    🎅
                </div>
            );
        } else if (ghost) {
            // Grinch (Hantu)
            const grinchEmoji = ghost.isFrightened ? '👻' : '😈'; // Hantu ketakutan atau Grinch marah
            const ghostColor = ghost.isFrightened ? '#3B82F6' : ghost.color; // Biru jika ketakutan

            content = (
                <div className="text-2xl" style={{ color: ghostColor }}>
                    {grinchEmoji}
                </div>
            );
        }

        return (
            <div key={`${x}-${y}`} className={classes} style={{ width: TILE_SIZE, height: TILE_SIZE }}>
                {content}
            </div>
        );
    };

    const renderGameScreen = () => {
        const mapStyle = {
            gridTemplateColumns: `repeat(${MAP_WIDTH}, ${TILE_SIZE}px)`,
            gridTemplateRows: `repeat(${MAP_HEIGHT}, ${TILE_SIZE}px)`,
        };

        return (
            <div className="flex flex-col items-center w-full">
                {/* Score and Power Status */}
                <div className="w-full max-w-lg mx-auto bg-red-800 p-3 rounded-t-xl shadow-xl mb-4 flex justify-between items-center border-b-4 border-yellow-400">
                    <h2 className="text-2xl font-extrabold text-white flex items-center">
                        <Zap className="w-5 h-5 mr-1 text-yellow-400" /> SCORE: {gameState.score}
                    </h2>
                    {gameState.isPowerActive ? (
                         <div className="text-sm font-bold text-yellow-300 flex items-center">
                            <Shield className="w-4 h-4 mr-1" /> POWER: {gameState.powerTimer.toFixed(1)}s
                        </div>
                    ) : (
                         <div className="text-sm font-bold text-white/50 flex items-center">
                            MODE NORMAL
                        </div>
                    )}
                </div>

                {/* Canvas Game */}
                <div
                    className="grid border-8 border-red-500 shadow-[0_0_50px_rgba(255,200,0,0.5)] bg-gray-900 rounded-lg overflow-hidden"
                    style={mapStyle}
                >
                    {gameState.map.map((row, y) =>
                        row.map((tile, x) => renderTile(tile, x, y))
                    )}
                </div>

                {/* Status Overlay */}
                {(status === 'GAME_OVER' || status === 'GAME_WIN') && (
                    <div className="absolute inset-0 bg-gray-900/95 flex flex-col items-center justify-center z-20 rounded-xl m-4">
                        <h1 className="text-6xl font-extrabold mb-4 animate-bounce" style={{ color: status === 'GAME_WIN' ? '#10B981' : '#EF4444' }}>
                            {status === 'GAME_WIN' ? '🎉 SELAMAT NATAL!' : '💔 MISI GAGAL'}
                        </h1>
                        <p className="text-3xl text-yellow-400 mb-6 font-bold">Skor Akhir: {gameState.score}</p>
                        <p className="text-lg text-gray-300 mb-8">
                            {currentScoreSubmitted ? (
                                <span className='text-green-400 flex items-center'>
                                    <CheckCircle className='w-5 h-5 mr-2' /> Skor telah dicatat di Somnia Mainnet.
                                </span>
                            ) : (
                                <span className='text-yellow-400 flex items-center'>
                                    {web3Status.loading ? <LoadingSpinner message="Mengirim skor..." /> : "Mencatat skor ke Leaderboard Kontrak..."}
                                </span>
                            )}
                        </p>

                        <button
                            onClick={() => setStatus('MAIN_MENU')}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition duration-300 transform hover:scale-105 disabled:opacity-50"
                            disabled={web3Status.loading && !currentScoreSubmitted}
                        >
                            Kembali ke Menu Utama
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const renderWeb3StatusCard = () => (
        <div className="w-full p-3 bg-green-700/80 rounded-xl shadow-lg mb-4 border border-green-400">
            <h3 className="text-lg font-bold mb-2 flex items-center text-white">
                <Wallet className="w-5 h-5 mr-2 text-yellow-400" /> Dompet & Jaringan
            </h3>
            {web3Status.connected ? (
                <>
                    <p className="text-sm text-yellow-300 font-mono flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" /> Address: {web3Status.address.substring(0, 6)}...{web3Status.address.substring(web3Status.address.length - 4)}
                    </p>
                    <p className="text-xs text-gray-200 mt-1">Jaringan: Somnia Mainnet</p>
                </>
            ) : (
                <p className="text-sm text-red-300 font-semibold flex items-center">
                    <XCircle className="w-4 h-4 mr-1" /> Tidak Terhubung
                </p>
            )}

            {web3Status.loading && <LoadingSpinner message={web3Status.message} />}
            {web3Status.error && (
                <p className="text-xs text-red-300 mt-2 p-1 bg-red-900/50 rounded flex items-center"><AlertTriangle className='w-4 h-4 mr-1' /> {web3Status.error}</p>
            )}
        </div>
    );

    const renderLeaderboard = () => (
        <div className="w-full p-4 bg-red-800 rounded-xl shadow-lg border border-red-500">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 mr-2" /> PAPAN PERINGKAT
            </h2>
             {web3Status.loading && <LoadingSpinner message="Memuat Leaderboard..." />}
            
            <div className="mb-4 p-2 bg-red-900 rounded text-center">
                <p className="text-sm text-gray-300">Total Skor Anda (Akumulatif)</p>
                <p className="text-xl font-extrabold text-green-400">{contractData.totalScore || '0'}</p>
            </div>

            <ul className="space-y-2 max-h-60 overflow-y-auto">
                {contractData.leaderboard.length > 0 ? (
                    contractData.leaderboard.map((player, index) => (
                        <li key={player.address} className={`p-2 rounded-lg flex justify-between items-center font-mono transition duration-200 ${
                            index < 3 ? 'bg-yellow-500/30 border-l-4 border-yellow-500' : 'bg-gray-700/50'
                        } ${player.address.toLowerCase() === web3Status.address?.toLowerCase() ? 'bg-blue-600/50 border-blue-400' : ''}`}>
                            <div className="flex items-center">
                                <span className="font-extrabold text-lg mr-3 w-6 text-center text-white">{index + 1}.</span>
                                <span className="text-sm text-gray-200">
                                    {player.address.substring(0, 6)}...{player.address.substring(player.address.length - 4)}
                                </span>
                            </div>
                            <span className="font-extrabold text-lg text-green-400">{player.score}</span>
                        </li>
                    ))
                ) : (
                    <p className="text-center text-gray-400">Belum ada skor yang dicatat.</p>
                )}
            </ul>
        </div>
    );

    const renderMainMenu = () => {
        const feeEth = contractData.feeWei ? ethers.utils.formatEther(contractData.feeWei) : '0';
        const feeDisplay = contractData.feeWei && contractData.feeWei !== '0' ? `${feeEth} SOMI` : 'GRATIS';

        return (
            <div className="w-full p-6 max-w-sm mx-auto bg-gray-900 rounded-xl shadow-2xl border-4 border-red-500/80">
                <h1 className="text-4xl font-extrabold text-green-500 text-center mb-6">
                    Misi Sinterklas
                </h1>

                {renderWeb3StatusCard()}

                {!web3Status.connected ? (
                    <button
                        onClick={connectWallet}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg transition duration-300 transform hover:scale-[1.02]"
                        disabled={web3Status.loading}
                    >
                        {web3Status.loading ? 'Menghubungkan...' : <span className='flex items-center justify-center'><Wallet className='w-5 h-5 mr-2' /> HUBUNGKAN DOMPET</span>}
                    </button>
                ) : (
                    <>
                        <div className="mb-6 p-3 bg-red-700 rounded-lg text-white font-semibold text-center shadow-inner border border-red-500">
                            Biaya Masuk (`startGame`): <span className="text-yellow-400 font-bold">{feeDisplay}</span>
                        </div>
                        
                        <button
                            onClick={handleStartGame}
                            className="w-full bg-yellow-500 hover:bg-yellow-600 text-red-900 font-extrabold text-lg py-3 rounded-xl shadow-[0_0_20px_rgba(255,255,0,0.7)] transition duration-300 transform hover:scale-[1.03] disabled:opacity-50"
                            disabled={web3Status.loading || !contractData.feeWei}
                        >
                             {web3Status.loading ? <LoadingSpinner message="Menunggu Transaksi..." /> : <span className='flex items-center justify-center'><Dices className='w-6 h-6 mr-2' /> MULAI BERMAIN</span>}
                        </button>
                    </>
                )}
            </div>
        );
    };

    const renderSidebar = () => (
        <div className={`fixed inset-y-0 right-0 w-80 bg-gray-900 p-4 border-l-4 border-red-500 z-50 transform ${showSidebar ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 lg:static lg:w-96 lg:translate-x-0 lg:p-6 lg:bg-transparent lg:border-none`}>
            <button 
                onClick={() => setShowSidebar(false)} 
                className="lg:hidden absolute top-4 left-4 text-red-400 text-2xl font-bold"
            >
                &times;
            </button>
            <div className="mt-8 lg:mt-0">
                {renderWeb3StatusCard()}
                {renderLeaderboard()}
            </div>
        </div>
    );

    // Main render switch
    return (
        <div className="min-h-screen bg-green-900 flex flex-col items-center p-4 font-sans relative overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
            {/* CSS Snow Animation */}
            <style jsx="true">{`
                @keyframes snowfall {
                    0% { transform: translateY(-100vh); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translateY(100vh); opacity: 0; }
                }

                .snowflake {
                    position: absolute;
                    width: 5px;
                    height: 5px;
                    background: #FFFFFF;
                    border-radius: 50%;
                    pointer-events: none;
                    animation: snowfall 15s linear infinite;
                    opacity: 0;
                }

                ${[...Array(50)].map((_, i) => `
                    .snowflake:nth-child(${i + 1}) {
                        left: ${Math.random() * 100}%;
                        animation-duration: ${Math.random() * 10 + 5}s;
                        animation-delay: ${Math.random() * 10}s;
                        filter: blur(${Math.random() * 1}px);
                    }
                `).join('\n')}
            `}</style>
            
            {/* Snowflakes Container */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {[...Array(50)].map((_, i) => <div key={i} className="snowflake"></div>)}
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-red-500 mt-4 mb-8 z-10 p-2 bg-green-900/80 rounded-lg shadow-2xl border-b-4 border-yellow-400">
                SOMNIA CHRISTMAS CARNIVAL
            </h1>
            
            {/* Konten Utama */}
            <div className="flex w-full max-w-6xl z-10">
                {/* Kolom Kiri: Menu/Game Area (Mobile: Center) */}
                <div className="w-full flex justify-center lg:w-2/3 lg:pr-6">
                    {status === 'MAIN_MENU' && renderMainMenu()}
                    {(status === 'PLAYING' || status === 'GAME_OVER' || status === 'GAME_WIN') && renderGameScreen()}
                </div>

                {/* Kolom Kanan: Sidebar Leaderboard (Mobile: Hidden/Overlay) */}
                <div className="hidden lg:block lg:w-1/3">
                    {renderSidebar()}
                </div>
                
                {/* Tombol Toggle Sidebar (Mobile Only) */}
                <button 
                    onClick={() => setShowSidebar(true)} 
                    className="fixed bottom-4 right-4 lg:hidden p-3 bg-red-700 text-white rounded-full shadow-xl z-50"
                >
                    <Menu className='w-6 h-6' />
                </button>
            </div>
            {/* Render Sidebar untuk mobile overlay */}
            {showSidebar && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setShowSidebar(false)}></div>}
            {renderSidebar()} 
        </div>
    );
};

export default App;



