import amqp from 'amqplib';

const rabbitSettings = {
    protocol: 'amqp',
    hostname: '54.163.129.164', 
    port: 5672,
    username: 'blocksolutions',
    password: 'leedpees'
};

const queue = 'conection';  // Nombre de la cola

async function receiveMessage() {
    try {
        // Conectar a RabbitMQ
        const connection = await amqp.connect(rabbitSettings);
        console.log('Conectado a RabbitMQ');

        // Crear un canal
        const channel = await connection.createChannel();
        console.log('Canal creado');

        // Asegurarse de que la cola exista
        await channel.assertQueue(queue, { durable: true });
        console.log("Escuchando la cola ${queue}");

        // Consumir mensajes de la cola
        channel.consume(queue, (message) => {
            if (message) {
                // Procesar el mensaje recibido
                const receivedMessage = JSON.parse(message.content.toString());
                console.log('Mensaje recibido:', receivedMessage);
                
                // Acknowledge el mensaje (confirmamos que fue recibido y procesado)
                channel.ack(message);
            }
        });

    } catch (error) {
        console.error('Error al conectar o recibir el mensaje:', error);
    }
}

// Llamar a la función para recibir el mensaje
receiveMessage();