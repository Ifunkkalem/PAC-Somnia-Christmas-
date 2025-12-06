import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Gift, Dices, TrendingUp, Wallet, CheckCircle, XCircle, Zap, Shield, Loader, AlertTriangle, Menu, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

// --- KONFIGURASI WEB3 KRITIS ---
const CONTRACT_ADDRESS = "0xD76b767102F2610B0C97FEE84873c1fAa4C7C365"; 
const ABI_JSON = '[{"inputs":[{"internalType":"address","name":"_treasury","type":"address"},{"internalType":"uint256","name":"_startFeeWei","type":"uint256"},{"internalType":"uint256","name":"_maxScorePerSubmit","type":"uint256"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"player","type":"address"},{"indexed":false,"internalType":"uint256","name":"fee","type":"uint256"}],"name":"GameStarted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"player","type":"address"},{"indexed":false":"uint256","name":"score","type":"uint256"}],"name":"ScoreSubmitted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Withdraw","type":"event"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"allPlayers","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getTop10","outputs":[{"internalType":"address[]","name":"topPlayers","type":"address[]"},{"internalType":"uint256[]","name":"scores","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"maxScorePerSubmit","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"players","outputs":[{"internalType":"uint256","name":"totalScore","type":"uint256"},{"internalType":"uint256","name":"lastPlayed","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"startFeeWei","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"startGame","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"score","type":"uint256"}],"name":"submitScore","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"}]';
const ABI = JSON.parse(ABI_JSON);


// --- KONFIGURASI GAME ---
const MAP_WIDTH = 21;
const MAP_HEIGHT = 13; 
const TILE_SIZE = 20; 
const PACMAN_START = { x: 10, y: 11 };
const GHOST_START_POSITIONS = [
    { x: 9, y: 5, color: '#0000FF' }, 
    { x: 11, y: 5, color: '#00FFFF' }, 
    { x: 10, y: 4, color: '#FF00FF' }, 
    { x: 10, y: 5, color: '#FFFF00' }  
];

const INITIAL_MAP = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1],
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

function initializeGameMap() {
    const map = INITIAL_MAP.map(row => [...row]);
    map[1][1] = 2;
    map[1][MAP_WIDTH - 2] = 2;
    map[MAP_HEIGHT - 2][1] = 2;
    map[MAP_HEIGHT - 2][MAP_WIDTH - 2] = 2;
    
    for (let y = 4; y <= 6; y++) {
        for (let x = 9; x <= 11; x++) {
            if (map[y][x] === 0) map[y][x] = 3; 
        }
    }
    return map;
}

function countDots(map) {
    return map.flat().filter(tile => tile === 0 || tile === 2).length;
}

const initialGameState = {
    map: initializeGameMap(),
    pacman: PACMAN_START,
    direction: 'RIGHT',
    nextDirection: 'RIGHT', 
    score: 0,
    ghosts: GHOST_START_POSITIONS.map(pos => ({
        ...pos,
        x: pos.x,
        y: pos.y,
        direction: 'UP',
        isFrightened: false,
        isEaten: false,
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
    const [status, setStatus] = useState('MAIN_MENU'); 
    
    // State untuk menangkap error sebelum Ethers.js siap
    const [fatalError, setFatalError] = useState(null); 

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
        feeWei: null, 
        maxScore: null, 
        ethersReady: false, 
    });
    const gameIntervalRef = useRef(null);
    const lastUpdateTimeRef = useRef(Date.now());
    const [currentScoreSubmitted, setCurrentScoreSubmitted] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false); 

    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    
    // --- Effect untuk inisialisasi Ethers.js dan Fatal Error Check ---
    useEffect(() => {
        try {
            if (typeof window.ethers !== 'undefined') {
                setContractData(d => ({ ...d, ethersReady: true }));
            } else {
                setFatalError('Ethers.js library (Web3 dependency) failed to load. Please check your network or refresh the page.');
                console.error("Ethers.js tidak dimuat. Gagal inisialisasi Web3.");
            }
        } catch (e) {
             setFatalError('A synchronous error occurred during Web3 setup: ' + e.message);
        }
    }, []);

    // --- RENDER BLOK FATAL ERROR ---
    if (fatalError) {
        return (
            <div className="min-h-screen bg-green-900 flex items-center justify-center p-4">
                <div className="w-full p-6 max-w-sm mx-auto bg-red-900 rounded-xl shadow-2xl border-4 border-red-500/80 text-white text-center z-10">
                    <AlertTriangle className='w-12 h-12 mx-auto text-yellow-400 mb-4' />
                    <h1 className="text-2xl font-extrabold mb-2">KESALAHAN KRITIS FATAL</h1>
                    <p className='text-sm text-red-300'>{fatalError}</p>
                    <p className='text-xs mt-4'>Aplikasi tidak dapat berjalan tanpa Ethers.js. Silakan muat ulang halaman atau hubungi dukungan.</p>
                </div>
            </div>
        );
    }
    
    // Jika ethers belum siap, tampilkan loading utama, TAPI HANYA JIKA TIDAK ADA FATAL ERROR
    if (!contractData.ethersReady) {
         return (
             <div className="min-h-screen bg-green-900 flex items-center justify-center p-4">
                <LoadingSpinner message="Memuat dependensi Web3 (Ethers.js)..." />
             </div>
         );
    }
    
    // --- LOGIKA BERJALAN HANYA JIKA Ethers.js READY ---

    // --- INIT Ethers.js dan Connect Wallet ---
    const connectWallet = useCallback(async () => {
        if (!window.ethereum) {
            setWeb3Status(s => ({ ...s, error: 'MetaMask atau dompet Web3 tidak terdeteksi.', message: 'Instal ekstensi dompet atau gunakan browser DApp.' }));
            return;
        }

        setWeb3Status(s => ({ ...s, loading: true, error: null, message: 'Menghubungkan ke dompet...' }));
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            // Akses window.ethers di sini
            const localProvider = new window.ethers.providers.Web3Provider(window.ethereum);
            setProvider(localProvider);
            const localSigner = localProvider.getSigner();
            setSigner(localSigner);
            const address = await localSigner.getAddress();

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
        if (typeof window.ethers === 'undefined') return null; 

        if (!provider && !readOnly) return null; 
        
        const activeProvider = readOnly ? provider : signer;
        if (!activeProvider) return null;

        return new window.ethers.Contract(CONTRACT_ADDRESS, ABI, activeProvider);
    }, [provider, signer]);

    const fetchData = useCallback(async (address) => {
        if (typeof window.ethers === 'undefined') return; // Guard clause
        const contract = getContractInstance(true);
        if (!contract) return;
        
        setContractData(d => ({ ...d, loading: true }));

        try {
            const [players, scores] = await contract.getTop10();
            const leaderboard = players.map((addr, index) => ({
                address: addr,
                score: scores[index].toString(),
            }));

            let totalScore = '0';
            if (address) {
                const playerData = await contract.players(address);
                totalScore = playerData.totalScore.toString();
            }

            const feeWei = await contract.startFeeWei();
            const maxScore = await contract.maxScorePerSubmit();

            setContractData(d => ({ 
                ...d, leaderboard, totalScore, 
                feeWei: feeWei.toString(), maxScore: maxScore.toString(),
                loading: false 
            }));

        } catch (error) {
            console.error("Gagal mengambil data kontrak:", error);
            setContractData(d => ({ ...d, loading: false }));
        }
    }, [getContractInstance]);

    useEffect(() => {
        if (contractData.ethersReady) {
            fetchData(web3Status.address);
        }
    }, [web3Status.connected, web3Status.address, fetchData, contractData.ethersReady]);


    // --- LOGIKA KONTRAK: TRANSAKSI (WRITE) ---

    const handleStartGame = async () => {
        if (!web3Status.connected || !signer || !contractData.feeWei || typeof window.ethers === 'undefined') {
            setWeb3Status(s => ({ ...s, error: 'Harap hubungkan dompet Anda terlebih dahulu atau Ethers.js belum siap.' }));
            return;
        }
        setWeb3Status(s => ({ ...s, loading: true, error: null, message: 'Memulai game (menunggu konfirmasi transaksi)...' }));

        try {
            const contract = getContractInstance(false);
            const fee = window.ethers.BigNumber.from(contractData.feeWei);
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
        if (!web3Status.connected || !signer || currentScoreSubmitted || typeof window.ethers === 'undefined') {
            console.error("Dompet belum terhubung, skor sudah dikirim, atau Ethers.js belum siap.");
            return;
        }

        setWeb3Status(s => ({ ...s, loading: true, error: null, message: `Mengirim skor ${finalScore} ke Somnia Mainnet...` }));

        try {
            const contract = getContractInstance(false);
            const scoreBN = window.ethers.BigNumber.from(finalScore);

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

    const canMove = (x, y, dir, map) => {
        let dx = 0, dy = 0;
        switch (dir) {
            case 'UP': dy = -1; break;
            case 'DOWN': dy = 1; break;
            case 'LEFT': dx = -1; break;
            case 'RIGHT': dx = 1; break;
        }
        const nextX = x + dx;
        const nextY = y + dy;

        if (nextX < 0 || nextX >= MAP_WIDTH || nextY < 0 || nextY >= MAP_HEIGHT || map[nextY][nextX] === 1) {
            if (nextY === 7 && (nextX < 0 || nextX >= MAP_WIDTH)) return true; 
            return false;
        }
        return true;
    };
    
    const moveGhost = (ghost, map, pacmanPos) => {
        if (ghost.isEaten && ghost.respawnTimer > 0) return ghost;

        const moves = [
            { dx: 0, dy: -1, dir: 'UP' }, { dx: 0, dy: 1, dir: 'DOWN' },
            { dx: -1, dy: 0, dir: 'LEFT' }, { dx: 1, dy: 0, dir: 'RIGHT' },
        ];
        let bestMove = null;
        let distanceMetric = ghost.isFrightened ? -Infinity : Infinity; 
        const targetPos = ghost.isFrightened ? { x: MAP_WIDTH - 1, y: 1 } : pacmanPos; 

        for (const move of moves) {
            const nextX = ghost.x + move.dx;
            const nextY = ghost.y + move.dy;

            if (canMove(ghost.x, ghost.y, move.dir, map)) {
                if (!((move.dir === 'UP' && ghost.direction === 'DOWN') ||
                    (move.dir === 'DOWN' && ghost.direction === 'UP') ||
                    (move.dir === 'LEFT' && ghost.direction === 'RIGHT') ||
                    (move.dir === 'RIGHT' && ghost.direction === 'LEFT'))) {

                    const distance = Math.hypot(targetPos.x - nextX, targetPos.y - nextY);

                    if ((ghost.isFrightened && distance > distanceMetric) || (!ghost.isFrightened && distance < distanceMetric)) {
                        distanceMetric = distance;
                        bestMove = move;
                    }
                }
            }
        }

        if (bestMove) {
            return {
                ...ghost, 
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
            let newDirection = prev.direction;

            // --- Gerak Sinterklas ---
            let moved = false;
            let nextDirection = prev.nextDirection;
            let targetDirection = prev.nextDirection; 

            if (canMove(newPacman.x, newPacman.y, targetDirection, newMap)) {
                newDirection = targetDirection;
            } else {
                targetDirection = newDirection;
            }

            const nextPacman = { x: newPacman.x, y: newPacman.y };
            switch (newDirection) {
                case 'UP': nextPacman.y -= 1; moved = true; break;
                case 'DOWN': nextPacman.y += 1; moved = true; break;
                case 'LEFT': nextPacman.x -= 1; moved = true; break;
                case 'RIGHT': nextPacman.x += 1; moved = true; break;
                default: break;
            }

            if (canMove(newPacman.x, newPacman.y, newDirection, newMap)) {
                newPacman = nextPacman;

                // Handle Terowongan (Wraparound)
                if (newPacman.x < 0) newPacman.x = MAP_WIDTH - 1;
                else if (newPacman.x >= MAP_WIDTH) newPacman.x = 0;

                // Makan Dot/Pellet
                if (newMap[newPacman.y][newPacman.x] === 0) { 
                    newScore += 10;
                    newMap[newPacman.y][newPacman.x] = 3; 
                    newRemainingDots -= 1;
                }
                if (newMap[newPacman.y][newPacman.x] === 2) { 
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
            } else {
                newDirection = prev.direction; 
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
                        isEaten: false, isFrightened: newIsPowerActive,
                    };
                }

                return moveGhost(ghost, newMap, newPacman);
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
                        if (!currentScoreSubmitted && web3Status.connected && contractData.ethersReady) handleSubmitScore(newScore);
                        break;
                    }
                }
            }

            // --- Cek Kemenangan ---
            if (newRemainingDots === 0) {
                currentStatus = 'GAME_WIN';
                 if (!currentScoreSubmitted && web3Status.connected && contractData.ethersReady) handleSubmitScore(newScore);
            }

            return {
                ...prev, map: newMap, pacman: newPacman, score: newScore, ghosts: newGhosts,
                isPowerActive: newIsPowerActive, powerTimer: newPowerTimer, remainingDots: newRemainingDots,
                direction: newDirection, 
                status: currentStatus,
            };
        });
    }, [handleSubmitScore, currentScoreSubmitted, web3Status.connected, contractData.ethersReady]);


    // Effect untuk loop dan input
    useEffect(() => {
        if (status === 'PLAYING') {
            gameIntervalRef.current = setInterval(gameLoop, 150); 
        } else if (gameIntervalRef.current) {
            clearInterval(gameIntervalRef.current);
            gameIntervalRef.current = null;
        }
        return () => {
            if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
        };
    }, [status, gameLoop]);

    // Handle Keyboard Input
    useEffect(() => {
        const handleKeyDown = (e) => {
            let newDirection = null;
            if (['ArrowUp', 'w', 'W'].includes(e.key)) newDirection = 'UP';
            else if (['ArrowDown', 's', 'S'].includes(e.key)) newDirection = 'DOWN';
            else if (['ArrowLeft', 'a', 'A'].includes(e.key)) newDirection = 'LEFT';
            else if (['ArrowRight', 'd', 'D'].includes(e.key)) newDirection = 'RIGHT';

            if (newDirection && status === 'PLAYING') {
                e.preventDefault();
                setGameState(prev => ({ ...prev, nextDirection: newDirection }));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [status]);
    
    // Handle Touch Input
    const handleTouchMove = (newDirection) => {
        if (status === 'PLAYING') {
            setGameState(prev => ({ ...prev, nextDirection: newDirection }));
        }
    };


    // --- RENDERING TILE KHUSUS (SESUAI GAMBAR) ---
    const renderTile = (tile, x, y) => {
        const isPacman = gameState.pacman.x === x && gameState.pacman.y === y;
        const ghost = gameState.ghosts.find(g => g.x === x && g.y === y && !g.isEaten);

        let content = null;
        let classes = 'flex items-center justify-center relative';
        
        classes += ' bg-green-900 border-2 border-green-800';

        if (tile === 1) { 
            classes = 'bg-repeat bg-center border-white/50 border-2 shadow-inner shadow-gray-900/50'
            const stripeStyle = {
                backgroundImage: 'linear-gradient(45deg, #FF0000 25%, #FFFFFF 25%, #FFFFFF 50%, #FF0000 50%, #FF0000 75%, #FFFFFF 75%, #FFFFFF 100%)',
                backgroundSize: `${TILE_SIZE/2}px ${TILE_SIZE/2}px`,
            };
            return <div key={`${x}-${y}`} className={classes} style={{ width: TILE_SIZE, height: TILE_SIZE, ...stripeStyle }}></div>;
        } 
        
        if (tile === 0) {
            content = <div className="w-2 h-2 bg-yellow-300 rounded-full shadow-lg animate-pulse"></div>;
        } else if (tile === 2) {
            content = <div className="text-xl animate-spin">⭐</div>;
        } else if (tile === 3) {
             content = null;
        }

        if (isPacman) {
            content = (
                <div className={`text-2xl transition-transform duration-100 ${gameState.isPowerActive ? 'scale-125' : 'scale-100'}`}>
                    🎅
                </div>
            );
        } else if (ghost) {
            const grinchEmoji = ghost.isFrightened ? '👻' : '😈'; 
            const ghostColor = ghost.isFrightened ? '#3B82F6' : ghost.color; 

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
        const gameSizePx = Math.min(MAP_WIDTH * TILE_SIZE, window.innerWidth * 0.9);
        const tileScaled = gameSizePx / MAP_WIDTH;

        const mapStyle = {
            gridTemplateColumns: `repeat(${MAP_WIDTH}, ${tileScaled}px)`,
            gridTemplateRows: `repeat(${MAP_HEIGHT}, ${tileScaled}px)`,
            width: gameSizePx,
            height: gameSizePx,
        };
        
        // Hanya format Ether jika Ethers.js tersedia
        const handleScoreSubmission = () => {
             if (status === 'GAME_OVER' || status === 'GAME_WIN') {
                if (!currentScoreSubmitted && web3Status.connected && contractData.ethersReady) {
                    handleSubmitScore(gameState.score);
                }
             }
        };
        
        // Trigger score submission once when game ends
        useEffect(() => { handleScoreSubmission(); }, [status]);

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
                    className="grid border-8 border-red-500 shadow-[0_0_50px_rgba(255,200,0,0.5)] bg-gray-900 rounded-lg overflow-hidden transition-all duration-300"
                    style={mapStyle}
                >
                    {gameState.map.map((row, y) =>
                        row.map((tile, x) => renderTile(tile, x, y))
                    )}
                </div>

                {/* Mobile Controls (Tombol Sentuh) */}
                <div className="mt-8 p-4 bg-gray-900/50 rounded-xl lg:hidden">
                    <h3 className="text-sm text-center text-gray-400 mb-4">Kontrol Mobile (Gunakan Keyboard di Desktop)</h3>
                    <div className="grid grid-cols-3 gap-2 w-48 mx-auto">
                        <div className="col-span-1"></div>
                        <button onClick={() => handleTouchMove('UP')} className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition transform hover:scale-105">
                            <ArrowUp className='w-6 h-6' />
                        </button>
                        <div className="col-span-1"></div>
                        <button onClick={() => handleTouchMove('LEFT')} className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition transform hover:scale-105">
                            <ArrowLeft className='w-6 h-6' />
                        </button>
                        <button onClick={() => handleTouchMove('DOWN')} className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition transform hover:scale-105">
                            <ArrowDown className='w-6 h-6' />
                        </button>
                        <button onClick={() => handleTouchMove('RIGHT')} className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition transform hover:scale-105">
                            <ArrowRight className='w-6 h-6' />
                        </button>
                    </div>
                </div>

                {/* Status Overlay */}
                {(status === 'GAME_OVER' || status === 'GAME_WIN') && (
                    <div className="absolute inset-0 bg-gray-900/95 flex flex-col items-center justify-center z-20 rounded-xl m-4">
                        <h1 className="text-6xl font-extrabold mb-4 animate-bounce" style={{ color: status === 'GAME_WIN' ? '#10B981' : '#EF4444' }}>
                            {status === 'GAME_WIN' ? '🎉 SELAMAT NATAL!' : '💔 MISI GAGAL'}
                        </h1>
                        <p className="text-3xl text-yellow-400 mb-6 font-bold">Skor Akhir: {gameState.score}</p>
                        <p className="text-lg text-gray-300 mb-8">
                            {web3Status.connected ? (
                                currentScoreSubmitted ? (
                                    <span className='text-green-400 flex items-center'>
                                        <CheckCircle className='w-5 h-5 mr-2' /> Skor telah dicatat di Somnia Mainnet.
                                    </span>
                                ) : (
                                    <span className='text-yellow-400 flex items-center'>
                                        {web3Status.loading ? <LoadingSpinner message="Mengirim skor..." /> : "Mencatat skor ke Leaderboard Kontrak..."}
                                    </span>
                                )
                            ) : (
                                <span className='text-red-400'>
                                    Skor tidak dicatat: Dompet tidak terhubung.
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
                    <p className="text-xs text-gray-200 mt-1">Jaringan: Somnia Mainnet (1729)</p>
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
             {contractData.loading && <LoadingSpinner message="Memuat Leaderboard..." />}
            
            <div className="mb-4 p-2 bg-red-900 rounded text-center border-2 border-red-700">
                <p className="text-sm text-gray-300">Total Skor Anda (Akumulatif)</p>
                <p className="text-xl font-extrabold text-green-400">{contractData.totalScore || '0'}</p>
            </div>

            <ul className="space-y-2 max-h-60 overflow-y-auto">
                {contractData.leaderboard.length > 0 ? (
                    contractData.leaderboard.map((player, index) => (
                        <li key={player.address} className={`p-2 rounded-lg flex justify-between items-center font-mono text-sm transition duration-200 ${
                            index < 3 ? 'bg-yellow-500/30 border-l-4 border-yellow-500' : 'bg-gray-700/50'
                        } ${player.address.toLowerCase() === web3Status.address?.toLowerCase() ? 'bg-blue-600/50 border-blue-400' : ''}`}>
                            <div className="flex items-center">
                                <span className="font-extrabold text-lg mr-3 w-6 text-center text-white">{index + 1}.</span>
                                <span className="text-gray-200">
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
        // Hanya format Ether jika Ethers.js tersedia
        const feeEth = contractData.feeWei && contractData.ethersReady ? window.ethers.utils.formatEther(contractData.feeWei) : '0';
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
                        disabled={web3Status.loading || !contractData.ethersReady}
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
                            disabled={web3Status.loading || !contractData.feeWei || !contractData.ethersReady}
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
        <div className="min-h-screen bg-green-900 flex flex-col items-center p-4 font-sans relative overflow-hidden">
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
                    className="fixed bottom-4 right-4 lg:hidden p-3 bg-red-700 text-white rounded-full shadow-xl z-50 transition-all duration-300 hover:scale-110"
                >
                    <Menu className='w-6 h-6' />
                </button>
            </div>
            {/* Render Sidebar untuk mobile overlay */}
            {showSidebar && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setShowSidebar(false)}></div>}
        </div>
    );
};

export default App;

