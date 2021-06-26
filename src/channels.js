module.exports = function(app) {
  if(typeof app.channel !== 'function') {
    // If no real-time functionality has been configured just return
    return;
  }

  const setOnlineStatus = async (props) => {
    const {connection, isOnline} = props;

    const id = connection.user._id;
    const data = {
      isOnline,
    };

    const userService = app.service('users');

    userService.patch(id, data).then(result => {
      const { name, surname } = result;

      if(isOnline) {
        console.log(`${name} ${surname} online!`);
      } else {
        console.log(`${name} ${surname} disconnected!`);
      }
    }).catch((...error) => console.log(error));
  };


  app.on('connection', connection => {
    // On a new real-time connection, add it to the anonymous channel
    app.channel('anonymous').join(connection);
  });

  app.on('disconnect', connection => {
    if(connection) {
      setOnlineStatus({connection, isOnline: false});
    }
  });


  app.on('login', async (authResult, { connection }) => {
    if(connection) {
      if(connection) {
        await setOnlineStatus({connection, isOnline: true});
        app.channel('anonymous').leave(connection);
        app.channel(`userId/${connection.user._id}`).join(connection);
        app.channel(`users/${connection.user._id}`).join(connection);
      }
    }
  });

  app.on('logout', async (authResult) => {
    if(authResult) {
      await setOnlineStatus({connection: authResult, isOnline: false});
    }
  });

  app.service('users').publish('patched',(data) => {
    return app.channel(`users/${data._id}`);
  });

  /*app.service('messages').publish(async (data, context) => {
    const conversation = await context.app.service('conversations').get(data.conversation_id);

    const channels = conversation.users.map(user => {
      return app.channel(`userId/${user._id}`);
    });

    return channels;
  });*/

  /*app.service('conversations').publish((data) => {
    const channels = data.users.map(user => {
      return app.channel(`userId/${user._id}`);
    });

    return channels;
  });*/
};
