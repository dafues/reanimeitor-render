const { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } = require('@solana/web3.js');
const { getAssociatedTokenAddress, createTransferInstruction } = require('@solana/spl-token');
const bs58 = require('bs58');
require('dotenv').config({ path: __dirname + '/.env' });

async function transferBGPTokens(toWallet, amount) {
    try {
        // Configuración desde .env
        // Configuración desde .env
const config = {
    rpcUrl: process.env.HELIUS_RPC_URL || `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY || '6a7ac70b-575a-4291-81f2-7b2cd0c2be26'}`,
    privateKey: process.env.SOLANA_PRIVATE_KEY,
    projectWallet: process.env.SOLANA_PROJECT_WALLET,
    bgpTokenMint: process.env.BGP_TOKEN_MINT,
    decimals: parseInt(process.env.BGP_TOKEN_DECIMALS || '9')
};

        console.log('🔧 Configuración cargada');
        console.log('   RPC:', config.rpcUrl);
        console.log('   From:', config.projectWallet);
        console.log('   To:', toWallet);
        console.log('   Amount:', amount, 'BGP');
        console.log('   Mint:', config.bgpTokenMint);

        // Validar configuración
        if (!config.privateKey) {
            throw new Error('SOLANA_PRIVATE_KEY no configurada en .env');
        }

        // 1. Conectar a Solana
        const connection = new Connection(config.rpcUrl, 'confirmed');
        
        // 2. Cargar wallet del proyecto desde private key
        const privateKeyUint8 = bs58.decode(config.privateKey);
        const fromWallet = Keypair.fromSecretKey(privateKeyUint8);
        
        console.log('✅ Wallet cargada desde private key');

        // 3. Convertir amount a lamports
        const lamports = BigInt(Math.floor(amount * Math.pow(10, config.decimals)));
        
        // 4. Obtener cuentas de token asociadas
        const mintPublicKey = new PublicKey(config.bgpTokenMint);
        const toPublicKey = new PublicKey(toWallet);
        
        const fromTokenAccount = await getAssociatedTokenAddress(
            mintPublicKey,
            fromWallet.publicKey
        );
        
        const toTokenAccount = await getAssociatedTokenAddress(
            mintPublicKey,
            toPublicKey
        );
        
        console.log('📦 Cuentas de token obtenidas');
        console.log('   From ATA:', fromTokenAccount.toString());
        console.log('   To ATA:', toTokenAccount.toString());
        // Verificar balance de SOL
console.log('🔍 Verificando balance de SOL...');
const solBalance = await connection.getBalance(fromWallet.publicKey);
console.log('💰 SOL disponible:', solBalance / 1e9, 'SOL');

if (solBalance < 5000) { // Mínimo 0.000005 SOL
    throw new Error(`SOL insuficiente para fee: ${solBalance / 1e9} SOL. Necesitas al menos 0.000005 SOL`);
}

        // 5. Verificar balance antes de transferir
        const fromBalance = await connection.getTokenAccountBalance(fromTokenAccount);
        console.log('💰 Balance disponible:', fromBalance.value.uiAmount, 'BGP');

        if (fromBalance.value.uiAmount < amount) {
            throw new Error(`Balance insuficiente: ${fromBalance.value.uiAmount} BGP < ${amount} BGP`);
        }

        // 6. Crear instrucción de transferencia
        const transferInstruction = createTransferInstruction(
            fromTokenAccount,
            toTokenAccount,
            fromWallet.publicKey,
            lamports
        );

        // 7. Crear y firmar transacción
        const transaction = new Transaction().add(transferInstruction);
        
        console.log('✍️ Firmando transacción...');
        const signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [fromWallet],
            { commitment: 'confirmed' }
        );

        console.log('✅ Transacción enviada y confirmada!');
        console.log('🔗 Firma:', signature);
        console.log('🌐 Explorer: https://solscan.io/tx/' + signature);

        return {
            success: true,
            signature: signature,
            explorer_url: 'https://solscan.io/tx/' + signature,
            amount: amount
        };

    } catch (error) {
        console.error('❌ Error en transferencia:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Ejecutar si se llama desde línea de comandos
if (require.main === module) {
    const toWallet = process.argv[2];
    const amount = parseFloat(process.argv[3]);
    
    if (!toWallet || !amount) {
        console.error('Uso: node transfer_bgp_real.js <wallet_destino> <cantidad>');
        console.error('Ejemplo: node transfer_bgp_real.js 9ukNiJgHK4iCaLGmY9dQLxK4N4vWcxjuzSiowdqQJpiS 1.0');
        process.exit(1);
    }
    
    transferBGPTokens(toWallet, amount)
        .then(result => console.log(JSON.stringify(result, null, 2)))
        .catch(error => console.error(JSON.stringify({ success: false, error: error.message }, null, 2)));
}

module.exports = { transferBGPTokens };