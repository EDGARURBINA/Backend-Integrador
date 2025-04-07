export const mqttConfig = {
  protocol: 'amqp',
  hostname: '54.164.116.230',
  port: 5672,
  username: 'blocksolutions-back',
  password: 'leedpees',
  queueHistory: 'history',  
  queueNotifications: 'notifications',  
  real_Time_Hour:"real-time-hour",
  real_Time_Minute:"real-time-minute",
  real_Time_AirPurity:"real-time-airPurity",
  real_Time_Humidity:"real-time-humidity",
  real_Time_Temperature:"real-time-temperature",
  real_Time_Weight1:"real-time-weight1",
  real_Time_Weight2:"real-time-weight2",
  reconnectTimeout: 2000
} 
