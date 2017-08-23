# FLAGS
@debug: if a feature or scenario contains this tag then only these scenarios are executed
@mockServer: scenarios containing this tag require a mockServer to be running as they expect
predictable data.

# CUCUMBER ARGS
--mockServer: if present the @mockServer tagged scenarios will run