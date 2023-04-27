import { createStreamingJsonParser } from '../src/StreamingJsonParser'

describe('StreamingJsonParser', () => {
    it('should parse streaming json', () => {
        const onJson = jest.fn()

        const parser = createStreamingJsonParser({
            onJson,
        })

        parser.write('{"foo": 1}\n{"bar": 2}\n')

        expect(onJson).toBeCalledTimes(2)
        expect(onJson).toBeCalledWith({ foo: 1 })
        expect(onJson).toBeCalledWith({ bar: 2 })
    })

    it('should parse streaming json with empty line', () => {
        const onJson = jest.fn()

        const parser = createStreamingJsonParser({
            onJson,
        })

        parser.write('{"foo": 1}\n\n{"bar": 2}\n')

        expect(onJson).toBeCalledTimes(2)
        expect(onJson).toBeCalledWith({ foo: 1 })
        expect(onJson).toBeCalledWith({ bar: 2 })
    })

    it('should parse streaming json with empty line at the end', () => {
        const onJson = jest.fn()

        const parser = createStreamingJsonParser({
            onJson,
        })

        parser.write('{"foo": 1}\n{"bar": 2}\n\n')

        expect(onJson).toBeCalledTimes(2)
        expect(onJson).toBeCalledWith({ foo: 1 })
        expect(onJson).toBeCalledWith({ bar: 2 })
    })

    it('should parse streaming json with empty line at the beginning', () => {
        const onJson = jest.fn()

        const parser = createStreamingJsonParser({
            onJson,
        })

        parser.write('\n{"foo": 1}\n{"bar": 2}\n')

        expect(onJson).toBeCalledTimes(2)
        expect(onJson).toBeCalledWith({ foo: 1 })
        expect(onJson).toBeCalledWith({ bar: 2 })
    })

    it('should parse streaming json with empty line at the beginning and end', () => {
        const onJson = jest.fn()

        const parser = createStreamingJsonParser({
            onJson,
        })

        parser.write('\n{"foo": 1}\n{"bar": 2}\n\n')

        expect(onJson).toBeCalledTimes(2)
        expect(onJson).toBeCalledWith({ foo: 1 })
        expect(onJson).toBeCalledWith({ bar: 2 })
    })

    it('should parse streaming json with empty line at the beginning and end and middle', () => {
        const onJson = jest.fn()

        const parser = createStreamingJsonParser({
            onJson,
        })

        parser.write('\n{"foo": 1}\n\n{"bar": 2}\n\n')

        expect(onJson).toBeCalledTimes(2)
        expect(onJson).toBeCalledWith({ foo: 1 })
        expect(onJson).toBeCalledWith({ bar: 2 })
    })

    it('should parse streaming json with empty line at the beginning and end and middle and multiple lines', () => {
        const onJson = jest.fn()

        const parser = createStreamingJsonParser({
            onJson,
        })

        parser.write('\n{"foo": 1}\n\n{"bar": 2}\n\n{"baz": 3}\n')

        expect(onJson).toBeCalledTimes(3)
        expect(onJson).toBeCalledWith({ foo: 1 })
        expect(onJson).toBeCalledWith({ bar: 2 })
        expect(onJson).toBeCalledWith({ baz: 3 })
    })

    it('should parse streaming json with empty line at the beginning and end and middle and multiple lines and empty line at the end', () => {
        const onJson = jest.fn()

        const parser = createStreamingJsonParser({
            onJson,
        })

        parser.write('\n{"foo": 1}\n\n{"bar": 2}\n\n{"baz": 3}\n\n')

        expect(onJson).toBeCalledTimes(3)
        expect(onJson).toBeCalledWith({ foo: 1 })
        expect(onJson).toBeCalledWith({ bar: 2 })
        expect(onJson).toBeCalledWith({ baz: 3 })
    })

    it('should handle partial json', () => {
        const onJson = jest.fn()

        const parser = createStreamingJsonParser({
            onJson,
        })

        parser.write('{"foo": 1}\n{"bar": 2')

        expect(onJson).toBeCalledTimes(1)
        expect(onJson).toBeCalledWith({ foo: 1 })

        parser.write('}\n')

        expect(onJson).toBeCalledTimes(2)
        expect(onJson).toBeCalledWith({ bar: 2 })
    })

    it('should handle partial json with empty line', () => {
        const onJson = jest.fn()

        const parser = createStreamingJsonParser({
            onJson,
        })

        parser.write('{"foo": 1}\n\n{"bar": 2')

        expect(onJson).toBeCalledTimes(1)
        expect(onJson).toBeCalledWith({ foo: 1 })

        parser.write('}\n')

        expect(onJson).toBeCalledTimes(2)
        expect(onJson).toBeCalledWith({ bar: 2 })
    })
})
