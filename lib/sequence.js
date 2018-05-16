module.exports = () => {
    let _chained = [];
    let _value;
    let _error;

    let chain = (func) =>{

        if ( _chained ) {
            _chained.push(func);
        }

        return this;
    }

    let execute = (index) => {
        var callback;
        index = typeof index === "number" ? index : 0;

        if ( ! _chained || index >= _chained.length ) {
            return true;
        }

        callback = _chained[index];

        callback({
            resolve: function(_value) {
                _value = _value;
                execute(++index);
            },
            reject: function(_error) {
                _error = _error;
            },
            response: {
                value: _value,
                error: _error
            }
        });
    };

    return {
        chain: chain,
        execute: execute
    }

};