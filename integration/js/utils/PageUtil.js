const clickElement = async (driver, element) => {
    await driver.executeScript("arguments[0].click();", element);
}

module.exports.clickElement = clickElement;