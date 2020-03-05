exports.sqs_handler = async(event, context, callback) => {
  const records = event.Records;

  console.log(records);

  return {};
}

exports.event_bridge_handler = async(event, context, callback) => {
  console.log(event);

  return {};
}
