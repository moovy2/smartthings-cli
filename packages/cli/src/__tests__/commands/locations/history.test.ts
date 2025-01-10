import { DeviceActivity, HistoryEndpoint, PaginatedList, SmartThingsClient } from '@smartthings/core-sdk'

import {
	buildOutputFormatter,
	calculateOutputFormat,
	IOFormat,
	writeOutput,
} from '@smartthings/cli-lib'

import LocationHistoryCommand from '../../../commands/locations/history'
import { calculateRequestLimit, getHistory, writeDeviceEventsTable } from '../../../lib/commands/history-util'
import { chooseLocation } from '../../../commands/locations'
import LocationDeviceHistoryCommand from '../../../commands/locations/history'


jest.mock('../../../lib/commands/history-util')
jest.mock('../../../commands/locations')

describe('LocationHistoryCommand', () => {
	const chooseLocationMock = jest.mocked(chooseLocation).mockResolvedValue('locationId')
	const historySpy = jest.spyOn(HistoryEndpoint.prototype, 'devices').mockImplementation()
	const calculateOutputFormatMock = jest.mocked(calculateOutputFormat).mockReturnValue(IOFormat.COMMON)
	const writeDeviceEventsTableMock = jest.mocked(writeDeviceEventsTable)
	const calculateRequestLimitMock = jest.mocked(calculateRequestLimit)
	const getHistoryMock = jest.mocked(getHistory)

	it('queries history and writes event table interactively', async () => {
		historySpy.mockResolvedValueOnce({
			items: [],
			hasNext: (): boolean => false,
		} as unknown as PaginatedList<DeviceActivity>)

		await expect(LocationHistoryCommand.run(['locationId'])).resolves.not.toThrow()

		expect(calculateRequestLimitMock).toHaveBeenCalledTimes(1)
		expect(calculateRequestLimitMock).toHaveBeenCalledWith(20)
		expect(chooseLocationMock).toHaveBeenCalledTimes(1)
		expect(chooseLocationMock).toHaveBeenCalledWith(expect.any(LocationDeviceHistoryCommand), 'locationId', true, true)
		expect(calculateOutputFormatMock).toHaveBeenCalledTimes(1)
		expect(historySpy).toHaveBeenCalledTimes(1)
		expect(historySpy).toHaveBeenCalledWith({
			locationId: 'locationId',
			limit: 20,
		})
		expect(writeDeviceEventsTableMock).toHaveBeenCalledTimes(1)
	})

	it('queries history and write event table directly', async () => {
		const outputFormatterMock = jest.fn().mockReturnValueOnce('formatted output')
		const buildOutputFormatterMock = jest.mocked(buildOutputFormatter<DeviceActivity[]>)
		const writeOutputMock = jest.mocked(writeOutput)

		const items = [{ deviceId: 'device-1' }] as DeviceActivity[]

		calculateRequestLimitMock.mockReturnValueOnce(20)
		calculateOutputFormatMock.mockReturnValueOnce(IOFormat.JSON)
		buildOutputFormatterMock.mockReturnValueOnce(outputFormatterMock)
		getHistoryMock.mockResolvedValueOnce(items)

		await expect(LocationHistoryCommand.run(['locationId'])).resolves.not.toThrow()

		expect(calculateRequestLimitMock).toHaveBeenCalledTimes(1)
		expect(calculateRequestLimitMock).toHaveBeenCalledWith(20)
		expect(chooseLocationMock).toHaveBeenCalledTimes(1)
		expect(chooseLocationMock).toHaveBeenCalledWith(expect.any(LocationDeviceHistoryCommand), 'locationId', true, true)
		expect(calculateOutputFormatMock).toHaveBeenCalledTimes(1)
		expect(getHistoryMock).toHaveBeenCalledTimes(1)
		expect(getHistoryMock).toHaveBeenCalledWith(
			expect.any(SmartThingsClient),
			20,
			20,
			expect.objectContaining({
				locationId: 'locationId',
			}),
		)
		expect(buildOutputFormatterMock).toHaveBeenCalledTimes(1)
		expect(outputFormatterMock).toHaveBeenCalledTimes(1)
		expect(outputFormatterMock).toHaveBeenCalledWith(items)
		expect(writeOutputMock).toHaveBeenCalledTimes(1)
		expect(writeOutputMock).toHaveBeenCalledWith('formatted output', undefined)

		expect(historySpy).toHaveBeenCalledTimes(0)
		expect(writeDeviceEventsTableMock).toHaveBeenCalledTimes(0)
	})
})
