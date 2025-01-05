<div class="orderInfo">
	<div class="cols cols-2">
		<table class="orderDetail">
			<tr>
				<td>{toLang('State')}:</td><td id="state-{id}">{state}</td>
			</tr>
			<tr>
				<td>{toLang("User")}:</td><td>{getUserName(data)}</td>
			</tr>
			<tr class="stayParam">
				<td>{toLang("Departure time")}:</td><td>{$.format.date(data.pickUpTime, dateTinyFormat)}</td>
			</tr>
			<tr class="stayParam">
				<td>{toLang("Length")}:</td><td>{DistanceToStr(data.meters)}</td>
			</tr>
			<tr class="stayParam">
				<td>{toLang("Seats")}:</td><td>{seats}</td>
			</tr>
			<tr class="dynParam overflow-dot">
				<td>{toLang("Remaining distance")}:</td><td class="remaindDistance">{remaindDistance}</td>
			</tr>
			<tr class="dynParam overflow-dot">
				<td>{toLang("Time left")}:</td><td class="remaindTime">0</td>
			</tr>
		</table>
		<div class="vidget speedInfo radius shadow">
			<div class="avgSpeed">0</div>
		</div>
		<div class="vidget stepInfo radius shadow expandable">
			<div class="instruction overflow-dot"></div>
			<div class="remaindDistance"></div>
		</div>
	</div>
</div>