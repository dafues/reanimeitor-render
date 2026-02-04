require('dotenv').config();
const express = require('express');
const { transferBGPTokens } = require('./transfer_bgp_real.js');

const app = express();
app.use(express.json());

app.post('/transfer', async (req, res) => {
    try {
        const { toWallet, amount } = req.body;
        console.log('📨 Recibiendo transferencia:', { toWallet, amount });
        
        const result = await transferBGPTokens(toWallet, parseFloat(amount));
        console.log('✅ Resultado:', result);
        res.json(result);
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/', (req, res) => {
    res.send('Solana Transfer Service OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
});